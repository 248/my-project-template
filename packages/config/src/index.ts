// 設定関連の定数・環境変数管理

export const APP_CONFIG = {
  APP_NAME: 'Project Template',
  VERSION: '0.1.0',
  API_BASE_URL:
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001',
} as const

export const isDevelopment = process.env['NODE_ENV'] === 'development'
export const isProduction = process.env['NODE_ENV'] === 'production'

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value && !defaultValue) {
    // システム内部エラー（ユーザー向けではない）
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    throw new Error(`Environment variable ${key} is required`)
  }
  return value ?? defaultValue ?? ''
}
