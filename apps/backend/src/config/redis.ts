import { z } from 'zod'

/**
 * Redis設定スキーマ
 * 環境変数を型安全に検証・変換する
 */
export const redisConfigSchema = z.object({
  // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
  REDIS_URL: z.string().optional().describe('Redis接続URL（優先）'),

  // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
  REDIS_HOST: z.string().default('localhost').describe('Redisホスト'),

  REDIS_PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(6379)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('Redisポート'),

  // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
  REDIS_PASSWORD: z.string().optional().describe('Redis認証パスワード'),

  REDIS_DB: z.coerce
    .number()
    .int()
    .min(0)
    .max(15)
    .default(0)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('Redisデータベース番号'),

  REDIS_MAX_RETRIES: z.coerce
    .number()
    .int()
    .min(0)
    .max(10)
    .default(3)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('リトライ回数'),

  REDIS_CONNECT_TIMEOUT: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(10000)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('接続タイムアウト（ミリ秒）'),

  REDIS_COMMAND_TIMEOUT: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(5000)
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    .describe('コマンドタイムアウト（ミリ秒）'),
})

export type RedisConfig = z.infer<typeof redisConfigSchema>

/**
 * 正規化されたRedis接続設定
 */
export interface RedisConnectionConfig {
  host: string
  port: number
  password?: string
  db: number
  maxRetriesPerRequest: number
  connectTimeout: number
  commandTimeout: number
}

/**
 * 環境変数からRedis設定を作成
 */
export function createRedisConfig(): {
  raw: RedisConfig
  connection: RedisConnectionConfig
} {
  try {
    const raw = redisConfigSchema.parse(process.env)

    // Redis URLがある場合は解析、なければ個別設定を使用
    let connection: RedisConnectionConfig

    if (raw.REDIS_URL) {
      const url = new URL(raw.REDIS_URL)
      connection = {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        db: url.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
        maxRetriesPerRequest: raw.REDIS_MAX_RETRIES,
        connectTimeout: raw.REDIS_CONNECT_TIMEOUT,
        commandTimeout: raw.REDIS_COMMAND_TIMEOUT,
      }
    } else {
      connection = {
        host: raw.REDIS_HOST,
        port: raw.REDIS_PORT,
        password: raw.REDIS_PASSWORD,
        db: raw.REDIS_DB,
        maxRetriesPerRequest: raw.REDIS_MAX_RETRIES,
        connectTimeout: raw.REDIS_CONNECT_TIMEOUT,
        commandTimeout: raw.REDIS_COMMAND_TIMEOUT,
      }
    }

    return { raw, connection }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
        `Redis configuration validation failed:\n${errorMessages}`
      )
    }
    throw error
  }
}
