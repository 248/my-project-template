import type { ServiceHealth } from '@template/api-contracts-ts'

/**
 * ヘルスチェック設定
 */
export interface HealthCheckConfig {
  /** 環境タイプ */
  environment: 'development' | 'production' | 'test'
  /** システム情報を露出するか */
  exposeSystemMetrics: boolean
  /** ヘルスチェック結果のキャッシュ時間（秒） */
  cacheDuration: number
  /** タイムアウト時間（ミリ秒） */
  timeout: number
}

/**
 * ヘルスチェック実行コンテキスト
 */
export interface HealthCheckContext {
  /** 設定 */
  config: HealthCheckConfig
  /** ロガー */
  logger: (message: string, error?: unknown) => void
  /** キャッシュ取得関数 */
  getCache?: (key: string) => Promise<ServiceHealth | null>
  /** キャッシュ設定関数 */
  setCache?: (key: string, value: ServiceHealth, ttl: number) => Promise<void>
}

/**
 * ヘルスチェックサービス定義
 */
export interface HealthCheckService {
  /** サービス名 */
  name: string
  /** ヘルスチェック実行関数 */
  check: (context: HealthCheckContext) => Promise<ServiceHealth>
  /** 必須サービスかどうか */
  required?: boolean
  /** キャッシュキー */
  cacheKey?: string
}

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  /** 全体のステータス */
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
  /** サービス別結果 */
  services: Record<string, ServiceHealth>
  /** 実行時エラー */
  errors: string[]
}
