import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { createLogger } from '@/utils/logger'
import { DetailedHealthCheckSchema } from '@template/api-contracts-ts'
import type {
  DetailedHealthCheck,
  ServiceHealth,
} from '@template/api-contracts-ts'

const log = createLogger('health')

// ヘルスチェック用のHonoインスタンス
export const healthApp = new OpenAPIHono()

// サービス開始時刻を記録
const startTime = Date.now()

/**
 * データベース接続のヘルスチェック
 */
function checkDatabaseHealth(): ServiceHealth {
  const start = performance.now()
  try {
    // TODO: Prismaクライアントが実装されたら実際のDB接続チェックを行う
    // const result = await prisma.$queryRaw`SELECT 1`

    // 現在はモック応答
    const responseTime = performance.now() - start
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: Math.round(responseTime * 100) / 100,
    }
  } catch (error) {
    const responseTime = performance.now() - start
    log.error(
      'Database health check failed: ' +
        (error instanceof Error ? error.message : String(error))
    )
    return {
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Database connection failed',
      responseTime: Math.round(responseTime * 100) / 100,
    }
  }
}

/**
 * Redis接続のヘルスチェック
 */
function checkRedisHealth(): ServiceHealth {
  const start = performance.now()
  try {
    // TODO: Redisクライアントが実装されたら実際の接続チェックを行う
    // const result = await redis.ping()

    // 現在はモック応答
    const responseTime = performance.now() - start
    return {
      status: 'healthy',
      message: 'Redis connection successful',
      responseTime: Math.round(responseTime * 100) / 100,
    }
  } catch (error) {
    const responseTime = performance.now() - start
    log.error(
      'Redis health check failed: ' +
        (error instanceof Error ? error.message : String(error))
    )
    return {
      status: 'unhealthy',
      message:
        error instanceof Error ? error.message : 'Redis connection failed',
      responseTime: Math.round(responseTime * 100) / 100,
    }
  }
}

/**
 * システムメトリクス取得
 */
function getSystemMetrics() {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()

  return {
    memory: {
      rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100, // MB
      heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
      heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // ミリ秒
      system: Math.round(cpuUsage.system / 1000), // ミリ秒
    },
  }
}

/**
 * 詳細ヘルスチェックルート定義
 */
const detailedHealthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  summary: '詳細ヘルスチェック',
  description: 'システム全体の詳細な健全性状態を取得',
  tags: ['System'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DetailedHealthCheckSchema,
        },
      },
      description: 'システム正常',
    },
    503: {
      content: {
        'application/json': {
          schema: DetailedHealthCheckSchema,
        },
      },
      description: 'サービス利用不可',
    },
  },
})

/**
 * 詳細ヘルスチェックハンドラー
 */
healthApp.openapi(detailedHealthRoute, c => {
  try {
    // 各サービスのヘルスチェックを実行
    const databaseHealth = checkDatabaseHealth()
    const redisHealth = checkRedisHealth()

    // APIサービスは常にhealthy（このエンドポイントが応答している時点で）
    const apiHealth: ServiceHealth = {
      status: 'healthy',
      message: 'API service is running',
      responseTime: 0,
    }

    // システム全体のステータス判定
    const services = {
      api: apiHealth,
      database: databaseHealth,
      redis: redisHealth,
    }

    // いずれかのサービスが unhealthy なら全体も unhealthy
    // いずれかのサービスが degraded なら全体も degraded
    // すべて healthy なら全体も healthy
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    if (
      databaseHealth.status === 'unhealthy' ||
      redisHealth.status === 'unhealthy'
    ) {
      overallStatus = 'unhealthy'
    } else if (
      databaseHealth.status === 'degraded' ||
      redisHealth.status === 'degraded'
    ) {
      overallStatus = 'degraded'
    }

    const response: DetailedHealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000), // 秒単位
      services,
      system: getSystemMetrics(),
      version: process.env['npm_package_version'] || '0.1.0',
      environment: process.env['NODE_ENV'] || 'development',
    }

    // ステータスに応じたHTTPステータスコード
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200

    log.info(
      `Health check completed - status: ${overallStatus}, uptime: ${response.uptime}s`
    )

    return c.json(response, statusCode)
  } catch (error) {
    log.error(
      'Health check error: ' +
        (error instanceof Error ? error.message : String(error))
    )

    const errorResponse: DetailedHealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        api: {
          status: 'unhealthy',
          message: 'Internal error occurred',
        },
      },
      system: getSystemMetrics(),
      version: process.env['npm_package_version'] || '0.1.0',
      environment: process.env['NODE_ENV'] || 'development',
    }

    return c.json(errorResponse, 503)
  }
})
