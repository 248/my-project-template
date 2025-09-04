/**
 * ヘルスチェックライブラリ
 * 拡張可能で型安全なヘルスチェックシステム
 */

// 型定義のエクスポート
export type {
  HealthCheckConfig,
  HealthCheckContext,
  HealthCheckService,
  HealthCheckResult,
} from './types'

// 設定関連のエクスポート
export { createHealthCheckConfig, validateHealthCheckConfig } from './config'

// マネージャーのエクスポート
export { HealthCheckManager } from './manager'

// デフォルトサービスのエクスポート
export {
  apiHealthService,
  createDatabaseHealthService,
  createRedisHealthService,
  createDefaultHealthServices,
  defaultHealthServices,
} from './services'

// ユーティリティ関数
import { HealthCheckManager } from './manager'
import { createHealthCheckConfig, validateHealthCheckConfig } from './config'
import { defaultHealthServices } from './services'

/**
 * デフォルト設定でヘルスチェックマネージャーを作成
 */
export function createDefaultHealthManager(
  logger: (message: string, error?: unknown) => void,
  cache?: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown, ttl: number) => Promise<void>
  }
): HealthCheckManager {
  const config = createHealthCheckConfig()

  // 設定の妥当性チェック
  const configErrors = validateHealthCheckConfig(config)
  if (configErrors.length > 0) {
    throw new Error(
      `Invalid health check configuration: ${configErrors.join(', ')}`
    )
  }

  const manager = new HealthCheckManager(config, logger, cache)

  // デフォルトサービスを登録
  manager.registerServices(defaultHealthServices)

  return manager
}
