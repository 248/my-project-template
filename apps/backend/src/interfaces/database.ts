/**
 * データベース接続結果
 */
export interface ConnectionResult {
  success: boolean
  error?: string
  responseTime?: number
}

/**
 * データベースサービスインターフェース
 * 実装に依存しない抽象化レイヤー
 */
export interface DatabaseService {
  /**
   * データベース接続をテスト
   */
  testConnection(): Promise<ConnectionResult>

  /**
   * データベースから切断
   */
  disconnect(): Promise<void>

  /**
   * 接続状態を確認
   */
  isConnected(): boolean

  /**
   * ヘルスチェック用メトリクス取得
   */
  getConnectionMetrics(): Promise<{
    activeConnections: number
    maxConnections: number
    queryCount: number
  }>
}

/**
 * DIコンテナで使用するトークン
 */
export const DATABASE_SERVICE_TOKEN = Symbol('DatabaseService')
