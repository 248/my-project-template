// Upstash Redis アダプタ（強制プレフィックス付き）
// upstash.mdの設計に基づく実装

import { Redis } from "@upstash/redis"

export interface RedisBindings {
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  ENV_NAME: string
}

export interface RedisAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, opts?: { ex?: number; px?: number }): Promise<void>
  incr(key: string): Promise<number>
  del(key: string): Promise<number>
  ping(): Promise<boolean>
}

export function createRedisAdapter(env: RedisBindings): RedisAdapter {
  const redis = new Redis({ 
    url: env.UPSTASH_REDIS_REST_URL, 
    token: env.UPSTASH_REDIS_REST_TOKEN 
  })
  
  // 強制プレフィックス: ENV_NAME:service:category:key
  const prefix = (k: string) => `${env.ENV_NAME}:${k}`

  return {
    async get<T>(key: string): Promise<T | null> {
      return await redis.get<T>(prefix(key))
    },
    
    async set<T>(key: string, value: T, opts?: { ex?: number; px?: number }): Promise<void> {
      if (opts) {
        await redis.set(prefix(key), value, opts.ex ? { ex: opts.ex } : opts.px ? { px: opts.px } : {})
      } else {
        await redis.set(prefix(key), value)
      }
    },
    
    async incr(key: string): Promise<number> {
      return await redis.incr(prefix(key))
    },
    
    async del(key: string): Promise<number> {
      return await redis.del(prefix(key))
    },
    
    async ping(): Promise<boolean> {
      try {
        const pong = await redis.ping()
        return pong === "PONG"
      } catch {
        return false
      }
    }
  }
}