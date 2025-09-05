import { createDatabaseConfig, type DatabaseConfig } from './database'
import { createRedisConfig, type RedisConfig } from './redis'
import { createServerConfig, type ServerConfig } from './server'
import { createClerkConfig, type ClerkConfig } from './clerk'

/**
 * アプリケーション設定の統合型
 */
export interface AppConfig {
  database: DatabaseConfig
  redis: RedisConfig
  server: ServerConfig
  clerk: ClerkConfig
}

/**
 * 設定の初期化状態を管理
 */
class ConfigManager {
  private _config: AppConfig | null = null
  private _initialized = false

  /**
   * 設定を初期化（アプリケーション起動時に一度だけ実行）
   */
  initialize(): AppConfig {
    if (this._initialized && this._config) {
      return this._config
    }

    try {
      const database = createDatabaseConfig()
      const redis = createRedisConfig()
      const server = createServerConfig()
      const clerk = createClerkConfig()

      this._config = {
        database,
        redis: redis.raw,
        server,
        clerk,
      }

      this._initialized = true
      return this._config
    } catch (error) {
      throw new Error(
        `Configuration initialization failed: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 初期化済み設定を取得
   */
  get config(): AppConfig {
    if (!this._initialized || !this._config) {
      throw new Error('Configuration not initialized. Call initialize() first.')
    }
    return this._config
  }

  /**
   * 初期化状態を確認
   */
  get isInitialized(): boolean {
    return this._initialized
  }
}

/**
 * グローバル設定マネージャー
 */
export const configManager = new ConfigManager()

/**
 * 設定を取得（初期化されていない場合は自動初期化）
 */
export function getConfig(): AppConfig {
  if (!configManager.isInitialized) {
    return configManager.initialize()
  }
  return configManager.config
}

// 型とユーティリティのre-export
export type { DatabaseConfig, RedisConfig, ServerConfig, ClerkConfig }
export { createDatabaseConfig } from './database'
export { createRedisConfig } from './redis'
export {
  createServerConfig,
  isDevelopment,
  isProduction,
  isTest,
} from './server'
export { createClerkConfig } from './clerk'
