import { type Context, type Next } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { WorkerEnv } from '../types/worker-env'

// 認証コンテキストの型定義
export interface AuthContext {
  userId: string
  sessionId?: string
  orgId?: string
}

// Honoコンテキストの型拡張
declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

// JWKSキャッシュ
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null

/**
 * JWKS（JSON Web Key Set）を取得または再利用
 */
function getJWKS(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(jwksUrl))
  }
  return jwksCache
}

/**
 * Workers環境用Clerk JWT認証ミドルウェア
 *
 * 機能:
 * - Bearer JWTトークンの検証
 * - JWKS（JSON Web Key Set）によるトークン検証
 * - 認証コンテキストの設定
 *
 * @param env Workers環境変数
 * @returns ミドルウェア関数
 */
export function requireAuth(env: WorkerEnv) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // Authorizationヘッダーの取得
    const authzHeader = c.req.header('Authorization') || ''
    const token = authzHeader.startsWith('Bearer ') ? authzHeader.slice(7) : null

    if (!token) {
      return c.json(
        {
          success: false,
          code: 'auth.signin_required',
          message: 'Authorization header with Bearer token is required',
        },
        401
      )
    }

    try {
      // Clerk設定
      const clerkSecretKey = env.CLERK_SECRET_KEY
      if (!clerkSecretKey) {
        throw new Error('CLERK_SECRET_KEY is not configured')
      }

      // 環境変数からissuerを取得、JWKSはissuerから自動構築
      const issuer = env.CLERK_JWT_ISSUER
      
      if (!issuer) {
        throw new Error('CLERK_JWT_ISSUER must be configured')
      }
      
      // JWKS URLはissuerから標準的なパスで構築
      const jwksUrl = `${issuer}/.well-known/jwks.json`

      const jwks = getJWKS(jwksUrl)

      // JWT検証
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
      })

      // 認証コンテキストの構築
      const auth: AuthContext = {
        userId: String(payload.sub),
        sessionId:
          typeof payload['sid'] === 'string' ? payload['sid'] : undefined,
        orgId:
          typeof payload['org_id'] === 'string' ? payload['org_id'] : undefined,
      }

      // コンテキストに認証情報を設定
      c.set('auth', auth)

      await next()
    } catch (error) {
      console.error('JWT verification failed:', error)
      return c.json(
        {
          success: false,
          code: 'auth.signin_required',
          message: 'JWT verification failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        401
      )
    }
  }
}

/**
 * 認証情報を取得するヘルパー関数
 */
export function getAuth(c: Context): AuthContext {
  const auth = c.get('auth')
  if (!auth) {
    throw new Error(
      'Authentication context not found. Ensure requireAuth middleware is applied.'
    )
  }
  return auth
}