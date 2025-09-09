import { Hono } from 'hono'
import { container } from 'tsyringe'
import { z } from 'zod'

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  type ValidationMessageKey,
} from '../lib/api-response'
import { requireAuth, getAuth } from '../middleware/clerk-auth'
import { UserService } from '../services/user'

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

/**
 * ZodエラーコードをValidationMessageKeyにマッピング
 */
function mapZodErrorToValidationCode(
  zodErrorCode: string
): ValidationMessageKey {
  switch (zodErrorCode) {
    case 'invalid_type':
    case 'required':
      return 'validation.field_required'
    case 'invalid_string':
      return 'validation.invalid_email' // 多くの場合emailバリデーション
    case 'too_small':
      return 'validation.string_too_short'
    case 'too_big':
      return 'validation.string_too_long'
    default:
      return 'validation.field_required' // フォールバック
  }
}

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
        value: 'input' in e ? e.input : undefined, // inputが存在する場合のみ取得
        constraints: {
          zodCode: e.code,
          zodMessage: e.message,
        },
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

export default users
