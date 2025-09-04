import type { HealthCheckConfig } from './types'

/**
 * 環境変数から設定値を取得するヘルパー
 */
function getEnvValue(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key]
  if (!value) return defaultValue
  const parsed = Number(value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * 環境別のヘルスチェック設定を作成
 */
export function createHealthCheckConfig(): HealthCheckConfig {
  const environment = getEnvValue('NODE_ENV', 'development')

  // 環境別のデフォルト設定
  const environmentDefaults = {
    development: {
      exposeSystemMetrics: true,
      cacheDuration: 30, // 30秒
      timeout: 5000, // 5秒
    },
    production: {
      exposeSystemMetrics: false, // 本番では最小限の情報のみ
      cacheDuration: 60, // 1分
      timeout: 3000, // 3秒
    },
    test: {
      exposeSystemMetrics: true,
      cacheDuration: 0, // テスト時はキャッシュなし
      timeout: 1000, // 1秒
    },
  }

  // 型ガード後は安全にアクセス可能
  type ValidEnvironment = 'development' | 'production' | 'test'
  function isValidEnvironment(env: string): env is ValidEnvironment {
    return env === 'development' || env === 'production' || env === 'test'
  }

  if (!isValidEnvironment(environment)) {
    throw new Error(`Invalid NODE_ENV: ${environment}`)
  }

  const defaults = environmentDefaults[environment]

  return {
    environment,
    exposeSystemMetrics: getEnvBoolean(
      'HEALTH_EXPOSE_SYSTEM_METRICS',
      defaults.exposeSystemMetrics
    ),
    cacheDuration: getEnvNumber(
      'HEALTH_CACHE_DURATION',
      defaults.cacheDuration
    ),
    timeout: getEnvNumber('HEALTH_CHECK_TIMEOUT', defaults.timeout),
  }
}

/**
 * 設定の妥当性をチェック
 */
export function validateHealthCheckConfig(config: HealthCheckConfig): string[] {
  const errors: string[] = []

  if (!['development', 'production', 'test'].includes(config.environment)) {
    errors.push(`Invalid environment: ${config.environment}`)
  }

  if (config.cacheDuration < 0) {
    errors.push(`Cache duration must be non-negative: ${config.cacheDuration}`)
  }

  if (config.timeout <= 0) {
    errors.push(`Timeout must be positive: ${config.timeout}`)
  }

  if (config.timeout > 30000) {
    errors.push(`Timeout too long (max 30s): ${config.timeout}ms`)
  }

  return errors
}
