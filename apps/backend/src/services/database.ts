import { injectable } from 'tsyringe'
import type { DatabaseService, ConnectionResult } from '@/interfaces'
import { testDatabaseConnection, getDb, disconnectDb } from '@/lib/db/prisma'

/**
 * Prismaを使用したデータベースサービスの実装
 */
@injectable()
export class PrismaDatabaseService implements DatabaseService {
  async testConnection(): Promise<ConnectionResult> {
    return await testDatabaseConnection()
  }

  async disconnect(): Promise<void> {
    await disconnectDb()
  }

  isConnected(): boolean {
    const db = getDb()
    return db !== null && db.$connect !== undefined
  }

  async getConnectionMetrics(): Promise<{
    activeConnections: number
    maxConnections: number
    queryCount: number
  }> {
    try {
      const db = getDb()
      if (!db) {
        return {
          activeConnections: 0,
          maxConnections: 0,
          queryCount: 0,
        }
      }

      // データベースの接続状況を実際にチェック
      await db.$queryRaw`SELECT 1`

      // Prisma Clientでは詳細なメトリクスが直接取得できないため
      // 基本的な情報を返す（実装可能な範囲で）
      return {
        activeConnections: this.isConnected() ? 1 : 0,
        maxConnections: 10, // 設定ファイルから取得可能にする予定
        queryCount: 0, // Prismaメトリクス拡張で実装予定
      }
    } catch (error) {
      console.error('Failed to get connection metrics:', error)
      return {
        activeConnections: 0,
        maxConnections: 0,
        queryCount: 0,
      }
    }
  }
}
