// Database interfaces
export type { DatabaseService, ConnectionResult } from './database'
export { DATABASE_SERVICE_TOKEN } from './database'

// Cache interfaces
export type { CacheService } from './cache'
export { CACHE_SERVICE_TOKEN } from './cache'

// Logger interfaces
export type { LoggerService, LogLevel, LogMetadata } from './logger'
export { LOGGER_SERVICE_TOKEN } from './logger'

// 個別にインポートしてからSERVICE_TOKENSオブジェクトで使用
import { DATABASE_SERVICE_TOKEN } from './database'
import { CACHE_SERVICE_TOKEN } from './cache'
import { LOGGER_SERVICE_TOKEN } from './logger'

/**
 * 全サービストークンの定数定義
 * DIコンテナで使用するシンボル
 */
export const SERVICE_TOKENS = {
  DATABASE: DATABASE_SERVICE_TOKEN,
  CACHE: CACHE_SERVICE_TOKEN,
  LOGGER: LOGGER_SERVICE_TOKEN,
} as const
