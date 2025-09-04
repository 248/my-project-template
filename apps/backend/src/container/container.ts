import 'reflect-metadata'
import { container } from 'tsyringe'
import type { DatabaseService, CacheService, LoggerService } from '@/interfaces'
import { SERVICE_TOKENS } from '@/interfaces'
import {
  PrismaDatabaseService,
  RedisService,
  PinoLoggerService,
} from '@/services'

/**
 * DIコンテナの初期化と設定
 * アプリケーション起動時に一度だけ実行される
 */
export function setupContainer(): void {
  // サービス実装をコンテナに登録
  container.register<DatabaseService>(SERVICE_TOKENS.DATABASE, {
    useClass: PrismaDatabaseService,
  })

  container.register<CacheService>(SERVICE_TOKENS.CACHE, {
    useClass: RedisService,
  })

  container.register<LoggerService>(SERVICE_TOKENS.LOGGER, {
    useClass: PinoLoggerService,
  })
}

/**
 * サービスを登録
 */
export function registerDatabaseService(
  implementation: new () => DatabaseService
): void {
  container.register<DatabaseService>(SERVICE_TOKENS.DATABASE, {
    useClass: implementation,
  })
}

export function registerCacheService(
  implementation: new () => CacheService
): void {
  container.register<CacheService>(SERVICE_TOKENS.CACHE, {
    useClass: implementation,
  })
}

export function registerLoggerService(
  implementation: new () => LoggerService
): void {
  container.register<LoggerService>(SERVICE_TOKENS.LOGGER, {
    useClass: implementation,
  })
}

/**
 * サービスを解決
 */
export function resolveDatabaseService(): DatabaseService {
  return container.resolve<DatabaseService>(SERVICE_TOKENS.DATABASE)
}

export function resolveCacheService(): CacheService {
  return container.resolve<CacheService>(SERVICE_TOKENS.CACHE)
}

export function resolveLoggerService(): LoggerService {
  return container.resolve<LoggerService>(SERVICE_TOKENS.LOGGER)
}

/**
 * コンテナをクリア（主にテスト用）
 */
export function clearContainer(): void {
  container.clearInstances()
}

/**
 * メインコンテナのexport
 */
export { container }
