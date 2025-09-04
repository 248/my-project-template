import { injectable, inject } from 'tsyringe'
import pino, { type Logger } from 'pino'
import type { LoggerService, LogLevel, LogMetadata } from '@/interfaces'

// ロガー設定の型
interface LoggerConfig {
  level: LogLevel
  development: boolean
}

// 設定トークン
export const LOGGER_CONFIG_TOKEN = Symbol('LoggerConfig')

/**
 * Pinoを使用したロガーサービスの実装
 */
@injectable()
export class PinoLoggerService implements LoggerService {
  private logger: Logger

  constructor(@inject(LOGGER_CONFIG_TOKEN) config: LoggerConfig) {
    this.logger = pino({
      level: config.level,
      transport: config.development
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: true,
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    })
  }

  trace(message: string, meta?: LogMetadata): void
  trace(meta: LogMetadata, message: string): void
  trace(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.trace((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.trace(messageOrMeta, metaOrMessage as string)
    }
  }

  debug(message: string, meta?: LogMetadata): void
  debug(meta: LogMetadata, message: string): void
  debug(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.debug((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.debug(messageOrMeta, metaOrMessage as string)
    }
  }

  info(message: string, meta?: LogMetadata): void
  info(meta: LogMetadata, message: string): void
  info(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.info((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.info(messageOrMeta, metaOrMessage as string)
    }
  }

  warn(message: string, meta?: LogMetadata): void
  warn(meta: LogMetadata, message: string): void
  warn(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.warn((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.warn(messageOrMeta, metaOrMessage as string)
    }
  }

  error(message: string, meta?: LogMetadata): void
  error(meta: LogMetadata, message: string): void
  error(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.error((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.error(messageOrMeta, metaOrMessage as string)
    }
  }

  fatal(message: string, meta?: LogMetadata): void
  fatal(meta: LogMetadata, message: string): void
  fatal(
    messageOrMeta: string | LogMetadata,
    metaOrMessage?: LogMetadata | string
  ): void {
    if (typeof messageOrMeta === 'string') {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.fatal((metaOrMessage as LogMetadata) || {}, messageOrMeta)
    } else {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.logger.fatal(messageOrMeta, metaOrMessage as string)
    }
  }

  child(bindings: LogMetadata): LoggerService {
    const childLogger = this.logger.child(bindings)
    return {
      trace: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.trace((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.trace(messageOrMeta, metaOrMessage as string)
        }
      },
      debug: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.debug((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.debug(messageOrMeta, metaOrMessage as string)
        }
      },
      info: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.info((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.info(messageOrMeta, metaOrMessage as string)
        }
      },
      warn: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.warn((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.warn(messageOrMeta, metaOrMessage as string)
        }
      },
      error: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.error((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.error(messageOrMeta, metaOrMessage as string)
        }
      },
      fatal: (
        messageOrMeta: string | LogMetadata,
        metaOrMessage?: LogMetadata | string
      ) => {
        if (typeof messageOrMeta === 'string') {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.fatal((metaOrMessage as LogMetadata) || {}, messageOrMeta)
        } else {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          childLogger.fatal(messageOrMeta, metaOrMessage as string)
        }
      },
      child: (childBindings: LogMetadata) =>
        this.child({ ...bindings, ...childBindings }),
      setLevel: (level: LogLevel) => {
        childLogger.level = level
      },
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      getLevel: () => childLogger.level as LogLevel,
    }
  }

  setLevel(level: LogLevel): void {
    this.logger.level = level
  }

  getLevel(): LogLevel {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return this.logger.level as LogLevel
  }
}
