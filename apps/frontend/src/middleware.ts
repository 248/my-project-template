import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証が不要な公開ルートを定義
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

/**
 * Clerk認証ミドルウェア + CSP + nonce設定
 *
 * 動作:
 * - 全ページでnonce生成とCSPヘッダー設定
 * - 公開ルート以外はすべて認証が必要
 * - 未認証ユーザーは自動的にサインインページにリダイレクト
 * - /homeは明示的に保護される
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // nonce生成（全リクエストで実行）- Web Crypto API使用
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  const nonce = btoa(String.fromCharCode.apply(null, Array.from(array)))

  // リクエストヘッダーにnonceを追加（下流に渡すため）
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  // Clerkの標準的な処理を行い、保護が必要な場合のみprotectを呼ぶ
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // レスポンス生成
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // CSPヘッダーを設定（全リクエストで実行）
  // 開発環境・Vercel preview環境では緩い設定、本番環境のみ厳格な設定
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isVercelPreview = process.env['VERCEL_ENV'] === 'preview'
  const useRelaxedCSP = isDevelopment || isVercelPreview

  // APIベースURLのオリジンをCSPに追加（環境変数があれば）
  // 例: https://my-project-template-api-preview.aestivalis01.workers.dev
  let apiOrigin = ''
  try {
    const apiBase = process.env['NEXT_PUBLIC_API_BASE_URL']
    if (apiBase) {
      apiOrigin = new URL(apiBase).origin
    }
  } catch {
    // 無効なURLは無視
    apiOrigin = ''
  }

  response.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      useRelaxedCSP
        ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}' https://*.clerk.dev https://*.clerk.com https://*.clerk.accounts.dev`
        : `script-src 'self' 'strict-dynamic' 'nonce-${nonce}' https://*.clerk.dev https://*.clerk.com https://*.clerk.accounts.dev`,
      // プレビュー/開発ではローカルも許可。本番は厳格に。
      useRelaxedCSP
        ? `connect-src 'self' ${apiOrigin || ''} http://localhost:8787 http://127.0.0.1:8787 https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev`
            .replace(/\s+/g, ' ')
            .trim()
        : `connect-src 'self' ${apiOrigin || ''} https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev`
            .replace(/\s+/g, ' ')
            .trim(),
      `worker-src 'self' blob:`,
      `frame-src https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev${isVercelPreview ? ' https://vercel.live' : ''}`,
      `img-src 'self' data: https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev https://img.clerk.com`,
      `style-src 'self' 'unsafe-inline'`,
      `base-uri 'self'`,
      `object-src 'none'`,
    ].join('; ')
  )

  return response
})

export const config = {
  // 静的アセットは除外
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
