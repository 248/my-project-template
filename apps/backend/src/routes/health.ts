import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { DetailedHealthCheckSchema } from '@template/api-contracts-ts'

import { resolveLoggerService } from '@/container/container'
import type { LoggerService } from '@/interfaces'
import { createDefaultHealthManager } from '@/lib/health'

// 遅延初期化: DIコンテナが初期化された後に取得する
const getLogger = (): LoggerService => {
  return resolveLoggerService().child({ name: 'health' })
}

// ヘルスチェック用のHonoインスタンス
export const healthApp = new OpenAPIHono()

/**
 * インメモリキャッシュの実装
 * 本番環境ではRedisなどの永続化されたキャッシュを推奨
 */
class MemoryCache {
  private cache = new Map<string, { value: unknown; expires: number }>()

  get(key: string): Promise<unknown> {
    const item = this.cache.get(key)
    if (!item) return Promise.resolve(null)

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return Promise.resolve(null)
    }

    return Promise.resolve(item.value)
  }

  set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expires })
    return Promise.resolve()
  }

  clear(): void {
    this.cache.clear()
  }
}

// ヘルスチェックマネージャーを初期化
const cache = new MemoryCache()
const healthManager = createDefaultHealthManager(
  (message: string, error?: unknown) => {
    if (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error)
      getLogger().error(`${message}: ${errorMessage}`)
    } else {
      getLogger().info(message)
    }
  },
  cache
)

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
healthApp.openapi(detailedHealthRoute, async c => {
  try {
    const result = await healthManager.checkHealth()

    // ステータスに応じたHTTPステータスコード
    const statusCode = result.status === 'unhealthy' ? 503 : 200

    return c.json(result, statusCode)
  } catch (error) {
    getLogger().error(
      'Health check handler error: ' +
        (error instanceof Error ? error.message : String(error))
    )

    // 緊急時のフォールバック応答
    return c.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: 0,
        services: {
          api: {
            status: 'unhealthy',
            message: 'Health check system failure',
          },
        },
        system: {
          memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
          cpu: { user: 0, system: 0 },
        },
        version: process.env['npm_package_version'] || '0.1.0',
        environment: process.env['NODE_ENV'] || 'development',
      },
      503
    )
  }
})
