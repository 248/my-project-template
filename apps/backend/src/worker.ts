// Cloudflare Workers用エントリーポイント
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { HealthCheckSchema } from '@template/api-contracts-ts'
import { parseWorkerEnvSafe } from '@template/shared'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { z } from 'zod'

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  mapZodErrorToValidationCode,
} from './lib/api-response-worker'
import { requireAuth, getAuth } from './middleware/clerk-auth-worker'
import { UserServiceWorker } from './services/user-worker'
import type { WorkerEnv } from './types/worker-env'

// Workers環境用の型定義（WorkerEnvを拡張）
export type Env = Partial<WorkerEnv>

// Hono アプリを作成
const app = new OpenAPIHono<{
  Bindings: Env
}>()

// CORSのワイルドカード判定用パターンキャッシュ（モジュールスコープで共有）
const corsPatternCache = new Map<string, RegExp>()

// ミドルウェア設定
app.use('*', honoLogger())
app.use('*', timing())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

// CORS設定
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // CORSはparseの副作用を避けるため raw env を直接参照
      const raw = (c.env as Record<string, unknown>) || {}
      const corsOriginVar = (raw['CORS_ORIGIN'] as string | undefined)?.trim()

      let corsOrigins: string[] = []
      if (corsOriginVar && corsOriginVar.length > 0) {
        // CORS_ORIGINが設定されている場合（カンマ区切り複数・ワイルドカード可）
        corsOrigins = corsOriginVar
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      } else {
        console.warn('警告: CORS_ORIGINが設定されていません')
        corsOrigins = [] // 明示的に全拒否
      }

      // デバッグログ
      console.log('🔍 CORS Debug:', {
        requestOrigin: origin,
        CORS_ORIGIN: corsOriginVar,
        allowedOrigins: corsOrigins,
      })

      // リクエストにoriginがない場合（例: Postman、サーバー間通信）は許可
      if (!origin) return origin

      // 末尾スラッシュの差異を吸収
      const normalize = (u: string) => u.replace(/\/+$/, '')

      // 許可されたオリジンかチェック（ワイルドカード *.vercel.app 等）
      const isAllowed = corsOrigins.some(allowed => {
        if (!allowed) return false
        if (allowed.includes('*')) {
          let pattern = corsPatternCache.get(allowed)
          if (!pattern) {
            const patternString =
              '^' +
              allowed
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\\*/g, '.*') +
              '$'
            pattern = new RegExp(patternString)
            corsPatternCache.set(allowed, pattern)
          }
          return pattern.test(origin)
        }
        return normalize(allowed) === normalize(origin)
      })
      console.log('🔍 CORS Result:', { origin, isAllowed })
      return isAllowed ? origin : null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

// ヘルスチェックルート
const healthCheckRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'ヘルスチェック',
  description: 'APIサーバーの状態確認',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthCheckSchema,
        },
      },
      description: 'サーバー正常',
    },
  },
})

app.openapi(healthCheckRoute, c => {
  const safeEnv = parseWorkerEnvSafe(c.env)
  return c.json({
    message: 'Project Template API (Cloudflare Workers)',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: safeEnv?.NODE_ENV || 'development',
  })
})

// 基本的なAPI情報エンドポイント
app.get('/health', c => {
  const safeEnv = parseWorkerEnvSafe(c.env)
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: safeEnv?.NODE_ENV || 'development',
  })
})

// プロフィール更新のバリデーションスキーマ
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.enum(['ja', 'en']).optional(),
})

// 認証関数のヘルパー
const authMiddleware = (c: Context<{ Bindings: Env }, string>, next: Next) => {
  const env = c.env as WorkerEnv
  return requireAuth(env)(c, next)
}

// 認証関連API
app.use('/api/auth/*', authMiddleware)
app.use('/api/users/*', authMiddleware)

app.post('/api/auth/users/ensure', async c => {
  try {
    const env = c.env
    const authContext = getAuth(c)

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured')
    }

    const userService = new UserServiceWorker(env.DATABASE_URL)

    // ユーザーを冪等に作成/更新
    const user = await userService.ensureUserFromAuth(authContext)

    return c.json(
      createSuccessResponse(
        {
          user: {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            locale: user.locale,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
        'success.user_ensured'
      )
    )
  } catch (error) {
    console.error('Failed to ensure user:', error)
    return c.json(
      createErrorResponse(
        'auth.ensure_failed',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'Failed to ensure user'
      ),
      500
    )
  }
})

// ユーザー情報取得API
app.get('/api/users/me', async c => {
  try {
    const env = c.env
    const authContext = getAuth(c)

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured')
    }

    const userService = new UserServiceWorker(env.DATABASE_URL)
    const user = await userService.getUserFromAuth(authContext)

    if (!user) {
      return c.json(
        createErrorResponse(
          'error.user_not_found',
          undefined,
          404,
          'User not found. Please sign in again.'
        ),
        404
      )
    }

    return c.json(
      createSuccessResponse(
        {
          user: {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            locale: user.locale,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
        'success.profile_retrieved'
      )
    )
  } catch (error) {
    console.error('Failed to retrieve profile:', error)
    return c.json(
      createErrorResponse(
        'error.profile_retrieval_failed',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'Failed to retrieve profile'
      ),
      500
    )
  }
})

// ユーザー情報更新API
app.put('/api/users/me', async c => {
  try {
    const env = c.env
    const authContext = getAuth(c)

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured')
    }

    // リクエストボディの取得とバリデーション
    const rawBody: unknown = await c.req.json()
    const validatedData = updateProfileSchema.parse(rawBody)

    const userService = new UserServiceWorker(env.DATABASE_URL)
    const user = await userService.updateUser(authContext.userId, validatedData)

    return c.json(
      createSuccessResponse(
        {
          user: {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatarUrl: user.avatarUrl,
            locale: user.locale,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        },
        'success.profile_updated'
      )
    )
  } catch (error) {
    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(e => ({
        field: e.path.join('.'),
        code: mapZodErrorToValidationCode(e.code),
        message: e.message,
      }))

      return c.json(createValidationErrorResponse(validationErrors), 400)
    }

    // ユーザーが見つからない場合
    if (error instanceof Error && error.message === 'User not found') {
      return c.json(
        createErrorResponse(
          'error.user_not_found',
          undefined,
          404,
          'User not found. Please sign in again.'
        ),
        404
      )
    }

    // その他のエラー
    console.error('Failed to update profile:', error)
    return c.json(
      createErrorResponse(
        'error.profile_update_failed',
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'Failed to update profile'
      ),
      500
    )
  }
})

// フロントエンド用のヘルスチェックAPIエンドポイント
app.get('/api/health', async c => {
  const { createDBAdapter } = await import('./adapters/db')
  const { createRedisAdapter } = await import('./adapters/redis')
  const { checkEnvironmentVariables, withTimeout } = await import('./utils/env')

  // 環境変数の型安全バリデーション
  const HealthCheckEnvSchema = z.object({
    DATABASE_URL: z.string().min(1),
    DB_DRIVER: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    ENV_NAME: z.string().min(1),
    NODE_ENV: z.string().optional(),
  })

  const parsedEnv = HealthCheckEnvSchema.safeParse(c.env)

  if (!parsedEnv.success) {
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Missing or invalid environment variables',
        details: parsedEnv.error.flatten().fieldErrors,
      },
      503
    )
  }

  const env = parsedEnv.data
  const startTime = Date.now()

  // 環境変数チェック
  const envChecks = checkEnvironmentVariables(env, [
    'DATABASE_URL',
    'DB_DRIVER',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'ENV_NAME',
  ])

  // DB接続テスト
  const dbAdapter = createDBAdapter(env)
  const dbResult = await withTimeout(dbAdapter.ping()).catch(e => ({
    ok: false,
    error: e.message === 'timeout' ? 'Connection timeout' : e.message,
    responseTime: Date.now() - startTime,
  }))

  // Redis接続テスト
  const redisAdapter = createRedisAdapter(env)
  const redisStartTime = Date.now()
  const redisResult = await withTimeout(
    redisAdapter.ping().then(ok => ({
      ok,
      error: ok ? undefined : 'Redis ping failed',
      responseTime: Date.now() - redisStartTime,
    }))
  ).catch(e => ({
    ok: false,
    error: e.message === 'timeout' ? 'Connection timeout' : e.message,
    responseTime: Date.now() - redisStartTime,
  }))

  // 総合ステータス判定
  const hasEnvError = envChecks.some(check => !check.ok)
  const hasDbError = !dbResult.ok
  const hasRedisError = !redisResult.ok
  const hasTimeout =
    dbResult.error?.includes('timeout') ||
    redisResult.error?.includes('timeout')

  const status =
    hasEnvError || hasDbError || hasRedisError
      ? hasTimeout
        ? 'degraded'
        : 'unhealthy'
      : 'healthy'

  return c.json(
    {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(Date.now() / 1000), // Workers用の簡易uptime
      services: {
        api: {
          status: 'healthy',
          message: 'Cloudflare Workers API is running',
          responseTime: Date.now() - startTime,
        },
        database: {
          status: dbResult.ok
            ? 'healthy'
            : hasTimeout
              ? 'degraded'
              : 'unhealthy',
          message: dbResult.ok ? 'Neon connection successful' : dbResult.error,
          responseTime: dbResult.responseTime,
        },
        redis: {
          status: redisResult.ok
            ? 'healthy'
            : hasTimeout
              ? 'degraded'
              : 'unhealthy',
          message: redisResult.ok
            ? 'Upstash Redis connection successful'
            : redisResult.error,
          responseTime: redisResult.responseTime,
        },
      },
      system: {
        memory: {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
        },
        cpu: {
          user: 0,
          system: 0,
        },
      },
      version: '0.1.0',
      environment: env.NODE_ENV || 'development',
    },
    status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503
  )
})

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.3',
  info: {
    version: '0.1.0',
    title: 'Project Template API',
    description:
      'A template API built with Hono, deployed on Cloudflare Workers',
  },
  servers: [
    {
      url: 'http://127.0.0.1:8787',
      description: 'ローカル開発環境（wrangler dev）',
    },
  ],
})

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

// Workersのエクスポート
export default app
