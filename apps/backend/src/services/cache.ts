import { injectable } from 'tsyringe'
import type { CacheService, ConnectionResult } from '@/interfaces'
import { testRedisConnection, getRedis, disconnectRedis } from '@/lib/db/redis'

/**
 * Redisを使用したキャッシュサービスの実装
 */
@injectable()
export class RedisService implements CacheService {
  async get(key: string): Promise<unknown> {
    try {
      const redis = getRedis()
      if (!redis) {
        throw new Error('Redis client not initialized')
      }

      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Failed to get cache value:', error)
      throw error
    }
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    try {
      const redis = getRedis()
      if (!redis) {
        throw new Error('Redis client not initialized')
      }

      const serializedValue = JSON.stringify(value)
      await redis.setex(key, ttl, serializedValue)
    } catch (error) {
      console.error('Failed to set cache value:', error)
      throw error
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const redis = getRedis()
      if (!redis) {
        throw new Error('Redis client not initialized')
      }

      const result = await redis.del(key)
      return result > 0
    } catch (error) {
      console.error('Failed to delete cache value:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const redis = getRedis()
      if (!redis) {
        throw new Error('Redis client not initialized')
      }

      await redis.flushall()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      throw error
    }
  }

  async testConnection(): Promise<ConnectionResult> {
    return await testRedisConnection()
  }

  async disconnect(): Promise<void> {
    await disconnectRedis()
  }

  isConnected(): boolean {
    const redis = getRedis()
    return redis !== null && redis.status === 'ready'
  }

  async getConnectionMetrics(): Promise<{
    connectedClients: number
    usedMemory: number
    keyspaceHits: number
    keyspaceMisses: number
  }> {
    try {
      const redis = getRedis()
      if (!redis) {
        return {
          connectedClients: 0,
          usedMemory: 0,
          keyspaceHits: 0,
          keyspaceMisses: 0,
        }
      }

      const info = await redis.info('stats')
      const memoryInfo = await redis.info('memory')

      // Redis INFOコマンドの結果をパースしてメトリクスを取得
      const parseInfo = (infoString: string) => {
        const result: Record<string, string> = {}
        infoString.split('\r\n').forEach(line => {
          if (line.includes(':')) {
            const parts = line.split(':')
            const key = parts[0]
            const value = parts[1]
            if (key && value !== undefined) {
              result[key] = value
            }
          }
        })
        return result
      }

      const statsData = parseInfo(info)
      const memoryData = parseInfo(memoryInfo)

      return {
        connectedClients: parseInt(statsData['connected_clients'] || '0', 10),
        usedMemory: parseInt(memoryData['used_memory'] || '0', 10),
        keyspaceHits: parseInt(statsData['keyspace_hits'] || '0', 10),
        keyspaceMisses: parseInt(statsData['keyspace_misses'] || '0', 10),
      }
    } catch (error) {
      console.error('Failed to get connection metrics:', error)
      return {
        connectedClients: 0,
        usedMemory: 0,
        keyspaceHits: 0,
        keyspaceMisses: 0,
      }
    }
  }
}
