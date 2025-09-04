/**
 * ログレベル定義
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * ログメタデータ
 */
export interface LogMetadata {
  [key: string]: unknown
}

/**
 * ログ設定
 */
export interface LoggerConfig {
  level: LogLevel
  development: boolean
}

/**
 * ロガーサービスインターフェース
 * pino実装に依存しない抽象化レイヤー
 */
export interface LoggerService {
  /**
   * トレースレベルログ
   */
  trace(message: string, meta?: LogMetadata): void
  trace(meta: LogMetadata, message: string): void

  /**
   * デバッグレベルログ
   */
  debug(message: string, meta?: LogMetadata): void
  debug(meta: LogMetadata, message: string): void

  /**
   * 情報レベルログ
   */
  info(message: string, meta?: LogMetadata): void
  info(meta: LogMetadata, message: string): void

  /**
   * 警告レベルログ
   */
  warn(message: string, meta?: LogMetadata): void
  warn(meta: LogMetadata, message: string): void

  /**
   * エラーレベルログ
   */
  error(message: string, meta?: LogMetadata): void
  error(meta: LogMetadata, message: string): void

  /**
   * 致命的エラーレベルログ
   */
  fatal(message: string, meta?: LogMetadata): void
  fatal(meta: LogMetadata, message: string): void

  /**
   * 子ロガーを作成
   */
  child(bindings: LogMetadata): LoggerService

  /**
   * ログレベルを設定
   */
  setLevel(level: LogLevel): void

  /**
   * 現在のログレベルを取得
   */
  getLevel(): LogLevel
}

/**
 * DIコンテナで使用するトークン
 */
export const LOGGER_SERVICE_TOKEN = Symbol('LoggerService')
