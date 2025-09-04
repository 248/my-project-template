import type { ServiceHealth } from '@template/api-contracts-ts'
import type { HealthCheckService, HealthCheckContext } from './types'

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
 * 実際のPrismaクライアントを使用する想定
 */
export const databaseHealthService: HealthCheckService = {
  name: 'database',
  check: async (context: HealthCheckContext): Promise<ServiceHealth> => {
    const start = performance.now()

    try {
      // キャッシュチェック
      if (context.getCache && context.config.cacheDuration > 0) {
        const cached = await context.getCache('health:database')
        if (cached) {
          context.logger('Database health check: using cached result')
          return cached
        }
      }

      // TODO: 実際のPrismaクライアント実装時に置換
      // const result = await prisma.$queryRaw`SELECT 1 as health_check`

      // 現在はモック実装（実際の接続チェックのシミュレーション）
      await new Promise(resolve => setTimeout(resolve, 10))

      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const result: ServiceHealth = {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
      }

      // キャッシュ保存
      if (context.setCache && context.config.cacheDuration > 0) {
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
}

/**
 * Redis接続のヘルスチェック
 * 実際のRedisクライアントを使用する想定
 */
export const redisHealthService: HealthCheckService = {
  name: 'redis',
  check: async (context: HealthCheckContext): Promise<ServiceHealth> => {
    const start = performance.now()

    try {
      // キャッシュチェック
      if (context.getCache && context.config.cacheDuration > 0) {
        const cached = await context.getCache('health:redis')
        if (cached) {
          context.logger('Redis health check: using cached result')
          return cached
        }
      }

      // TODO: 実際のRedisクライアント実装時に置換
      // const result = await redis.ping()

      // 現在はモック実装（実際の接続チェックのシミュレーション）
      await new Promise(resolve => setTimeout(resolve, 5))

      const responseTime = Math.round((performance.now() - start) * 100) / 100
      const result: ServiceHealth = {
        status: 'healthy',
        message: 'Redis connection successful',
        responseTime,
      }

      // キャッシュ保存
      if (context.setCache && context.config.cacheDuration > 0) {
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
}

/**
 * デフォルトのヘルスチェックサービス一覧
 */
export const defaultHealthServices: HealthCheckService[] = [
  apiHealthService,
  databaseHealthService,
  redisHealthService,
]
