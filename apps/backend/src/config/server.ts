import { z } from 'zod'

/**
 * サーバー設定スキーマ
 */
export const serverConfigSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('実行環境'),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(8000)
    .describe('サーバーポート'),

  npm_package_version: z
    .string()
    .default('0.1.0')
    .describe('アプリケーションバージョン'),

  HEALTH_CHECK_TIMEOUT: z.coerce
    .number()
    .int()
    .min(1000)
    .max(30000)
    .default(10000)
    .describe('ヘルスチェックタイムアウト（ミリ秒）'),

  HEALTH_CHECK_CACHE_DURATION: z.coerce
    .number()
    .int()
    .min(0)
    .max(300)
    .default(30)
    .describe('ヘルスチェックキャッシュ期間（秒）'),

  HEALTH_CHECK_EXPOSE_SYSTEM_METRICS: z.coerce
    .boolean()
    .default(true)
    .describe('システムメトリクスの公開'),
})

export type ServerConfig = z.infer<typeof serverConfigSchema>

/**
 * 環境変数からサーバー設定を作成
 */
export function createServerConfig(): ServerConfig {
  try {
    return serverConfigSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(
        `Server configuration validation failed:\n${errorMessages}`
      )
    }
    throw error
  }
}

/**
 * 開発環境判定
 */
export function isDevelopment(config: ServerConfig): boolean {
  return config.NODE_ENV === 'development'
}

/**
 * 本番環境判定
 */
export function isProduction(config: ServerConfig): boolean {
  return config.NODE_ENV === 'production'
}

/**
 * テスト環境判定
 */
export function isTest(config: ServerConfig): boolean {
  return config.NODE_ENV === 'test'
}
