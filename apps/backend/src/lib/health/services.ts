import type { ServiceHealth } from '@template/api-contracts-ts'
import type { HealthCheckService, HealthCheckContext } from './types'
import type { DatabaseService, CacheService } from '@/interfaces'
import { container } from '@/container/container'
import { SERVICE_TOKENS } from '@/interfaces'

/**
 * APIサービスのヘルスチェック
 * 常にhealthy（このエンドポイントが動作している時点で）
 */
export const apiHealthService: HealthCheckService = {
  name: 'api',
  check: (_context: HealthCheckContext): Promise<ServiceHealth> =>
    Promise.resolve({
      status: 'healthy',
      message: 'API service is running',
      responseTime: 0,
    }),
  required: true,
}

/**
 * データベース接続のヘルスチェック
 * DIコンテナから解決されるDatabaseServiceを使用
 */
export const createDatabaseHealthService = (): HealthCheckService => ({
  name: 'database',
  check: async (context: HealthCheckContext): Promise<ServiceHealth> => {
    const start = performance.now()

    try {
      // キャッシュチェック
      if (context.getCache && context.config.cacheDuration > 0) {
        const cached = await context.getCache('health:database')
        if (
          cached &&
          typeof cached === 'object' &&
          cached !== null &&
          'status' in cached
        ) {
          context.logger('Database health check: using cached result')
          return cached
        }
      }

      // DIコンテナからDatabaseServiceを解決
      const databaseService = container.resolve<DatabaseService>(
        SERVICE_TOKENS.DATABASE
      )
      const connectionTest = await databaseService.testConnection()

      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const result: ServiceHealth = {
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        message: connectionTest.success
          ? 'Database connection successful'
          : `Database connection failed: ${connectionTest.error}`,
        responseTime,
      }

      // キャッシュ保存（成功時のみ）
      if (
        context.setCache &&
        context.config.cacheDuration > 0 &&
        connectionTest.success
      ) {
        await context.setCache(
          'health:database',
          result,
          context.config.cacheDuration
        )
      }

      return result
    } catch (error) {
      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const errorMessage =
        error instanceof Error ? error.message : 'Database connection failed'

      context.logger('Database health check failed', error)

      return {
        status: 'unhealthy',
        message: errorMessage,
        responseTime,
      }
    }
  },
  required: true,
  cacheKey: 'health:database',
})

/**
 * Redis接続のヘルスチェック
 * DIコンテナから解決されるCacheServiceを使用
 */
export const createRedisHealthService = (): HealthCheckService => ({
  name: 'redis',
  check: async (context: HealthCheckContext): Promise<ServiceHealth> => {
    const start = performance.now()

    try {
      // キャッシュチェック
      if (context.getCache && context.config.cacheDuration > 0) {
        const cached = await context.getCache('health:redis')
        if (
          cached &&
          typeof cached === 'object' &&
          cached !== null &&
          'status' in cached
        ) {
          context.logger('Redis health check: using cached result')
          return cached
        }
      }

      // DIコンテナからCacheServiceを解決
      const cacheService = container.resolve<CacheService>(SERVICE_TOKENS.CACHE)
      const connectionTest = await cacheService.testConnection()

      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const result: ServiceHealth = {
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        message: connectionTest.success
          ? 'Redis connection successful'
          : `Redis connection failed: ${connectionTest.error}`,
        responseTime,
      }

      // キャッシュ保存（成功時のみ）
      if (
        context.setCache &&
        context.config.cacheDuration > 0 &&
        connectionTest.success
      ) {
        await context.setCache(
          'health:redis',
          result,
          context.config.cacheDuration
        )
      }

      return result
    } catch (error) {
      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const errorMessage =
        error instanceof Error ? error.message : 'Redis connection failed'

      context.logger('Redis health check failed', error)

      return {
        status: 'unhealthy',
        message: errorMessage,
        responseTime,
      }
    }
  },
  required: false, // Redisはオプショナル
  cacheKey: 'health:redis',
})

/**
 * デフォルトのヘルスチェックサービス一覧を作成
 * DIコンテナの初期化後に呼び出す必要がある
 */
export const createDefaultHealthServices = (): HealthCheckService[] => [
  apiHealthService,
  createDatabaseHealthService(),
  createRedisHealthService(),
]
