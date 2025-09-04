import Redis from 'ioredis'
import { createLogger } from '@/utils/logger'

const log = createLogger('redis')

/**
 * Redisクライアントのシングルトンインスタンス
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined
}

/**
 * Redis接続設定
 */
interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
  maxRetriesPerRequest: number
  connectTimeout: number
  commandTimeout: number
}

/**
 * 環境変数からRedis設定を作成
 */
function createRedisConfig(): RedisConfig {
  const redisUrl = process.env['REDIS_URL']

  if (redisUrl) {
    // Redis URLを解析
    const url = new URL(redisUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      db: url.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      commandTimeout: 5000,
    }
  }

  // フォールバック設定
  return {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'],
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000,
  }
}

/**
 * Redisクライアントを作成
 */
function createRedisClient(): Redis {
  const config = createRedisConfig()

  const redis = new Redis(config.port, config.host, {
    password: config.password,
    db: config.db,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    connectTimeout: config.connectTimeout,
    commandTimeout: config.commandTimeout,
    lazyConnect: true,
  })

  // イベントリスナーの設定
  redis.on('connect', () => {
    log.info(`Redis client connecting to ${config.host}:${config.port}`)
  })

  redis.on('ready', () => {
    log.info(`Redis client ready - connected to ${config.host}:${config.port}`)
  })

  redis.on('error', error => {
    log.error({ error: error.message }, 'Redis client error')
  })

  redis.on('close', () => {
    log.info('Redis client connection closed')
  })

  redis.on('reconnecting', (ms: number) => {
    log.info(`Redis client reconnecting in ${ms}ms`)
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
      log.info('Redis connection test successful')
      return { success: true }
    } else {
      log.error({ result }, 'Redis ping returned unexpected result')
      return {
        success: false,
        error: `Unexpected ping result: ${String(result)}`,
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown Redis error'
    log.error({ error: errorMessage }, 'Redis connection test failed')
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
      log.info('Redis client disconnected successfully')
    }
  } catch (error) {
    log.error({ error }, 'Failed to disconnect from Redis')
  }
}
