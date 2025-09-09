// Neon Database アダプタ
// transfer.mdの設計に基づく実装

import { neon } from "@neondatabase/serverless"

export interface DBBindings {
  DATABASE_URL: string
  DB_DRIVER: string
}

export interface DBAdapter {
  ping(): Promise<{ ok: boolean; error?: string; responseTime?: number }>
}

export function createNeonAdapter(env: DBBindings): DBAdapter {
  const sql = neon(env.DATABASE_URL)
  
  return {
    async ping(): Promise<{ ok: boolean; error?: string; responseTime?: number }> {
      const startTime = Date.now()
      
      try {
        await sql`SELECT 1`
        const responseTime = Date.now() - startTime
        return { ok: true, responseTime }
      } catch (error) {
        const responseTime = Date.now() - startTime
        return { 
          ok: false, 
          error: error instanceof Error ? error.message : "neon connection error",
          responseTime 
        }
      }
    }
  }
}

// 統一DB接続ファクトリ（将来の拡張対応）
export function createDBAdapter(env: DBBindings): DBAdapter {
  switch (env.DB_DRIVER) {
    case "neon":
      return createNeonAdapter(env)
    default:
      throw new Error(`Unsupported DB driver: ${env.DB_DRIVER}`)
  }
}