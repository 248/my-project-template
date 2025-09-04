import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 認証が不要な公開ルートを定義
const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

/**
 * Clerk認証ミドルウェア
 *
 * 動作:
 * - 公開ルート以外はすべて認証が必要
 * - 未認証ユーザーは自動的にサインインページにリダイレクト
 * - /homeは明示的に保護される
 */
export default clerkMiddleware(async (auth, req) => {
  // 公開ルートの場合は何もしない
  if (isPublicRoute(req)) {
    return
  }

  // その他のルートは認証を要求
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
})

export const config = {
  // Next.js内部ルート、静的ファイル、API routesを除外
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
