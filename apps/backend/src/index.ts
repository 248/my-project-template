// OpenTelemetryを最初に初期化（他のimportより前に実行）
import { telemetrySDK } from '@/utils/telemetry'

import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { resolveLoggerService } from '@/container/container'
import { tracingMiddleware } from '@/middleware/tracing'
// API契約パッケージからOpenAPI生成型を使用
import { HealthCheckSchema } from '@template/api-contracts-ts'
import { healthApp } from '@/routes/health-improved'
import authRoutes from '@/routes/auth'
import usersRoutes from '@/routes/users'
import { disconnectDatabase } from '@/lib/db/prisma'
import { disconnectRedis } from '@/lib/db/redis'
import { setupContainer } from '@/container/container'

// DIコンテナ初期化
setupContainer()

// ロガー設定
const log = resolveLoggerService().child({ name: 'server' })

// OpenAPI対応のHonoアプリを作成
const app = new OpenAPIHono()

// ミドルウェア設定
app.use('*', tracingMiddleware()) // OpenTelemetryトレーシング
app.use('*', honoLogger())
app.use('*', timing())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

// CORS設定 - Docker環境とローカル開発環境の両方に対応
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://frontend:3000', // Docker環境でのコンテナ間通信
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

// 共有されたヘルスチェックスキーマを使用

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
  return c.json({
    message: 'Project Template API Server',
    version: '0.1.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// ヘルスチェックルートをマウント
app.route('/', healthApp)

// 認証関連ルートをマウント
app.route('/api/auth', authRoutes)
app.route('/api/users', usersRoutes)

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.3',
  info: {
    version: '0.1.0',
    title: 'Project Template API',
    description: 'A template API built with Hono and OpenAPI',
  },
  servers: [
    {
      url: `http://localhost:${Number(process.env['PORT']) || 8000}`,
      description: '開発環境',
    },
  ],
})

app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }))

log.info('🧩 Dependency injection container initialized')

// OpenTelemetryを開始
telemetrySDK.start()
log.info('📊 OpenTelemetry telemetry started')

// サーバー起動
const port = Number(process.env['PORT']) || 8000
log.info(`🚀 Server is running on port ${port}`)
log.info(`📖 API Docs: http://localhost:${port}/api/docs`)
log.info(`🔍 OpenAPI Spec: http://localhost:${port}/api/openapi.json`)

log.info(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

// アプリケーション終了時のクリーンアップ処理
async function gracefulShutdown(signal: string) {
  log.info(`🛑 Received ${signal}, shutting down gracefully...`)

  try {
    // OpenTelemetry SDK終了
    await telemetrySDK.shutdown()
    log.info('📊 OpenTelemetry shutdown complete')

    // データベース接続終了
    await disconnectDatabase()
    log.info('🗄️ Database disconnected')

    // Redis接続終了
    await disconnectRedis()
    log.info('🔴 Redis disconnected')

    log.info('✅ Graceful shutdown complete')
    process.exit(0)
  } catch (error) {
    log.error({ error }, '❌ Error during graceful shutdown')
    process.exit(1)
  }
}

// シグナルハンドラー設定
process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM')
})
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT')
})
