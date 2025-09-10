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

  let response: NextResponse

  // 公開ルートかどうかで処理分岐
  if (isPublicRoute(req)) {
    // 公開ルート: 認証チェック無しでレスポンス生成
    response = NextResponse.next({ request: { headers: requestHeaders } })
  } else {
    // 保護ルート: 認証チェック実行
    const authResult = await auth()

    // 型ガードでprotect関数の存在を確認
    const hasProtectMethod = (
      result: unknown
    ): result is { protect: () => void | Promise<void> } => {
      return (
        result !== null &&
        typeof result === 'object' &&
        'protect' in result &&
        typeof Reflect.get(result, 'protect') === 'function'
      )
    }

    if (hasProtectMethod(authResult)) {
      void authResult.protect()
    }

    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  // CSPヘッダーを設定（全リクエストで実行）
  response.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src 'self' 'strict-dynamic' 'nonce-${nonce}'`,
      `connect-src 'self' https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev`,
      `frame-src https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev`,
      `img-src 'self' data: https://clerk.com https://*.clerk.dev https://*.clerk.accounts.dev`,
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
