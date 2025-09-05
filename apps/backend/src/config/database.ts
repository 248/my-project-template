import { z } from 'zod'

/**
 * データベース設定スキーマ
 * 環境変数を型安全に検証・変換する
 */
export const databaseConfigSchema = z.object({
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('PostgreSQL接続URL'),

  DB_POOL_SIZE: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('データベース接続プールサイズ'),

  DB_TIMEOUT: z.coerce
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(30000)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('データベース接続タイムアウト（ミリ秒）'),

  DB_RETRY_ATTEMPTS: z.coerce
    .number()
    .int()
    .min(0)
    .max(10)
    .default(3)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('接続リトライ回数'),
})

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>

/**
 * 環境変数からデータベース設定を作成
 * 検証エラー時は詳細なメッセージと共に例外を発生
 */
export function createDatabaseConfig(): DatabaseConfig {
  try {
    return databaseConfigSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
        `Database configuration validation failed:\n${errorMessages}`
      )
    }
    throw error
  }
}
