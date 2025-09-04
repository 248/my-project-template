/**
 * キャッシュサービスインターフェース
 * Redis実装に依存しない抽象化レイヤー
 */
export interface CacheService {
  /**
   * キャッシュから値を取得
   */
  get(key: string): Promise<unknown>

  /**
   * キャッシュに値を設定
   */
  set(key: string, value: unknown, ttl: number): Promise<void>

  /**
   * キャッシュから値を削除
   */
  delete(key: string): Promise<boolean>

  /**
   * キャッシュをクリア
   */
  clear(): Promise<void>

  /**
   * キャッシュ接続をテスト
   */
  testConnection(): Promise<ConnectionResult>

  /**
   * キャッシュサービスから切断
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
    connectedClients: number
    usedMemory: number
    keyspaceHits: number
    keyspaceMisses: number
  }>
}

/**
 * キャッシュ接続結果（database.tsから再利用）
 */
export interface ConnectionResult {
  success: boolean
  error?: string
  responseTime?: number
}

/**
 * DIコンテナで使用するトークン
 */
export const CACHE_SERVICE_TOKEN = Symbol('CacheService')
