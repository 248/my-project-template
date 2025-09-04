import Redis from 'ioredis'
import { createRedisConfig } from '@/config/redis'
import { resolveLoggerService } from '@/container/container'

// Note: DIコンテナが初期化される前に使用される可能性があるため、
// 遅延評価でLoggerServiceを取得
const getLogger = () => resolveLoggerService().child({ name: 'redis' })

/**
 * Redisクライアントのシングルトンインスタンス
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined
}

/**
 * Redisクライアントを作成
 */
function createRedisClient(): Redis {
  const { connection } = createRedisConfig()

  const redis = new Redis(connection.port, connection.host, {
    password: connection.password,
    db: connection.db,
    maxRetriesPerRequest: connection.maxRetriesPerRequest,
    connectTimeout: connection.connectTimeout,
    commandTimeout: connection.commandTimeout,
    lazyConnect: true,
  })

  // イベントリスナーの設定
  redis.on('connect', () => {
    getLogger().info(
      `Redis client connecting to ${connection.host}:${connection.port}`
    )
  })

  redis.on('ready', () => {
    getLogger().info(
      `Redis client ready - connected to ${connection.host}:${connection.port}`
    )
  })

  redis.on('error', error => {
    getLogger().error('Redis client error', { error: error.message })
  })

  redis.on('close', () => {
    getLogger().info('Redis client connection closed')
  })

  redis.on('reconnecting', (ms: number) => {
    getLogger().info(`Redis client reconnecting in ${ms}ms`)
  })

  return redis
}

// 開発環境では複数のインスタンス作成を防ぐ
const redis = globalThis.__redis ?? createRedisClient()

if (process.env['NODE_ENV'] === 'development') {
  globalThis.__redis = redis
}

/**
 * Redisクライアントのシングルトンインスタンス
 */
export { redis }

/**
 * Redisクライアントを取得（DIサービス用）
 */
export function getRedis(): Redis {
  return redis
}

/**
 * Redis接続をテスト
 */
export async function testRedisConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // まずは接続を試行
    if (redis.status === 'wait') {
      await redis.connect()
    }

    // PINGコマンドでテスト
    const result = await redis.ping()

    if (result === 'PONG') {
      getLogger().info('Redis connection test successful')
      return { success: true }
    } else {
      getLogger().error('Redis ping returned unexpected result', { result })
      return {
        success: false,
        error: `Unexpected ping result: ${String(result)}`,
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Redis error'
    getLogger().error('Redis connection test failed', { error: errorMessage })
    return { success: false, error: errorMessage }
  }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
export async function disconnectRedis(): Promise<void> {
  try {
    if (redis.status === 'ready') {
      await redis.quit()
      getLogger().info('Redis client disconnected successfully')
    }
  } catch (error) {
    getLogger().error('Failed to disconnect from Redis', { error })
  }
}
