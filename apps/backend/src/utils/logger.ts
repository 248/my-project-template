import pino from 'pino'

// 開発環境では pretty-print、本番環境では JSON
const isProduction = process.env['NODE_ENV'] === 'production'

const transport = isProduction
  ? undefined
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      },
    }

// ベースロガー
const baseLogger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport,
})

// 名前付きロガーを作成するファクトリー関数
export function createLogger(name: string) {
  return baseLogger.child({ name })
}

// デフォルトロガー
export const logger = createLogger('app')
