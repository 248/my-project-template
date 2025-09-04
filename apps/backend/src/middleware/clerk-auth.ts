import { type Context, type Next } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { getConfig } from '../config'

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
function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksCache) {
    const { clerk } = getConfig()
    jwksCache = createRemoteJWKSet(new URL(clerk.jwksUrl!))
  }
  return jwksCache
}

/**
 * Clerk JWT認証ミドルウェア
 *
 * 機能:
 * - Bearer JWTトークンの検証
 * - JWKS（JSON Web Key Set）によるトークン検証
 * - 認証コンテキストの設定
 *
 * @param c Honoコンテキスト
 * @param next 次のミドルウェア/ハンドラー
 * @returns Promise<Response>
 */
export async function requireAuth(
  c: Context,
  next: Next
): Promise<Response | void> {
  // Authorizationヘッダーの取得
  const authzHeader = c.req.header('Authorization') || ''
  const token = authzHeader.startsWith('Bearer ') ? authzHeader.slice(7) : null

  if (!token) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authorization header with Bearer token is required',
      },
      401
    )
  }

  try {
    const { clerk } = getConfig()
    const jwks = getJWKS()

    // JWT検証
    const { payload } = await jwtVerify(token, jwks, {
      issuer: clerk.issuer,
      ...(clerk.audience && { audience: clerk.audience }),
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
    return c.json(
      {
        error: 'Invalid token',
        message: 'JWT verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      401
    )
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
