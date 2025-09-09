/**
 * 型境界レイヤー - 環境変数の型安全化
 * Cloudflare Workers の c.env を any から安全な型に変換
 */
import { z } from 'zod'

// 環境変数スキーマ定義
const WorkerEnvSchema = z.object({
  // データベース接続
  DATABASE_URL: z.string().url('DATABASE_URLが無効なURL形式です'),

  // CORS設定
  CORS_ORIGIN: z.string().optional(),

  // JWT認証設定
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  // Redis設定
  REDIS_URL: z.string().url().optional(),

  // アプリケーション設定
  NODE_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // その他の必要な環境変数をここに追加
})

// 推論された型をエクスポート
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>

/**
 * 環境変数を安全に解析・検証する関数
 * @param env - Cloudflare Workers の c.env オブジェクト（any型）
 * @returns 型安全な WorkerEnv オブジェクト
 * @throws ZodError - 環境変数が不正な場合
 */
export const parseWorkerEnv = (env: unknown): WorkerEnv => {
  try {
    return WorkerEnvSchema.parse(env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('環境変数の検証に失敗しました:', {
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
          received: 'received' in e ? e.received : undefined,
        })),
      })
    }
    throw error
  }
}

/**
 * 環境変数を安全に解析し、エラー時にデフォルト値を返す関数
 * @param env - Cloudflare Workers の c.env オブジェクト（any型）
 * @param fallback - エラー時のフォールバック値
 * @returns 型安全な WorkerEnv オブジェクトまたはフォールバック値
 */
export const parseWorkerEnvSafe = (
  env: unknown,
  fallback?: Partial<WorkerEnv>
): WorkerEnv | null => {
  try {
    return parseWorkerEnv(env)
  } catch (error) {
    console.warn(
      '環境変数の解析に失敗しました。フォールバック値を使用します:',
      error
    )

    if (fallback) {
      // フォールバック値も検証
      try {
        return WorkerEnvSchema.parse({ ...fallback })
      } catch {
        console.error('フォールバック値も無効です')
        return null
      }
    }

    return null
  }
}
