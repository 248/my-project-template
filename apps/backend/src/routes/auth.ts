import { Hono } from 'hono'
import { container } from 'tsyringe'
import { UserService } from '../services/user'
import { requireAuth, getAuth } from '../middleware/clerk-auth'

/**
 * 認証関連のAPIルート
 *
 * エンドポイント:
 * - POST /auth/users/ensure - ユーザーの冪等作成/同期
 */
const auth = new Hono()

// 全認証ルートに認証ミドルウェアを適用
auth.use('/*', requireAuth)

/**
 * POST /auth/users/ensure
 * ユーザーを冪等に作成/同期
 *
 * 用途:
 * - 初回サインイン/サインアップ時
 * - Webhook に依存しない UX 保証
 */
auth.post('/users/ensure', async c => {
  try {
    const authContext = getAuth(c)
    const userService = container.resolve(UserService)

    // ユーザーを冪等に作成/更新
    const user = await userService.ensureUserFromAuth(authContext)

    return c.json({
      success: true,
      message: 'User ensured successfully',
      data: {
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
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'Failed to ensure user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default auth
