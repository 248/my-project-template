import { Hono } from 'hono'
import { z } from 'zod'
import { container } from 'tsyringe'
import { UserService } from '../services/user'
import { requireAuth, getAuth } from '../middleware/clerk-auth'

/**
 * ユーザー管理APIルート
 *
 * エンドポイント:
 * - GET /users/me - 自分のプロフィール取得
 * - PUT /users/me - 自分の設定の更新
 */
const users = new Hono()

// 全ユーザールートに認証ミドルウェアを適用
users.use('/*', requireAuth)

// プロフィール更新のバリデーションスキーマ
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.enum(['ja', 'en']).optional(),
})

/**
 * GET /users/me
 * 自分のプロフィール取得
 *
 * 用途:
 * - /home 初期表示用
 * - プロフィール画面での現在値表示
 */
users.get('/me', async c => {
  try {
    const authContext = getAuth(c)
    const userService = container.resolve(UserService)

    const user = await userService.getUserFromAuth(authContext)

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'User not found. Please sign in again.',
        },
        404
      )
    }

    return c.json({
      success: true,
      message: 'Profile retrieved successfully',
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
        message: 'Failed to retrieve profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * PUT /users/me
 * 自分の表示名/設定の更新
 *
 * 用途:
 * - 設定画面での情報更新
 * - プロフィール編集
 */
users.put('/me', async c => {
  try {
    const authContext = getAuth(c)
    const userService = container.resolve(UserService)

    // リクエストボディの取得とバリデーション
    const rawBody: unknown = await c.req.json()
    const validatedData = updateProfileSchema.parse(rawBody)

    // ユーザー情報を更新
    const user = await userService.updateUser(authContext.userId, validatedData)

    return c.json({
      success: true,
      message: 'Profile updated successfully',
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
    // バリデーションエラーの場合
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        400
      )
    }

    // ユーザーが見つからない場合
    if (error instanceof Error && error.message === 'User not found') {
      return c.json(
        {
          success: false,
          message: 'User not found. Please sign in again.',
        },
        404
      )
    }

    // その他のエラー
    return c.json(
      {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default users
