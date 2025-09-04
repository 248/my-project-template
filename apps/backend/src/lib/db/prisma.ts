import { PrismaClient } from '../../../generated/prisma'
import { createLogger } from '@/utils/logger'

const log = createLogger('prisma')

/**
 * Prismaクライアントのシングルトンインスタンス
 * 開発環境では複数のインスタンス作成を防ぐためにglobalThisを使用
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

/**
 * Prismaクライアントを作成・取得
 */
function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  })

  // ログイベントのハンドリング
  prisma.$on('query', e => {
    log.debug(
      {
        query: String(e.query),
        params: String(e.params),
        duration: Number(e.duration),
      },
      'Database query executed'
    )
  })

  prisma.$on('error', e => {
    log.error(
      {
        target: String(e.target),
        message: String(e.message),
      },
      'Database error occurred'
    )
  })

  prisma.$on('info', e => {
    log.info(
      {
        target: String(e.target),
        message: String(e.message),
      },
      'Database info'
    )
  })

  prisma.$on('warn', e => {
    log.warn(
      {
        target: String(e.target),
        message: String(e.message),
      },
      'Database warning'
    )
  })

  return prisma
}

// 開発環境では複数のインスタンス作成を防ぐ
const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = prisma
}

/**
 * Prismaクライアントのシングルトンインスタンス
 */
export { prisma }

/**
 * データベース接続をテスト
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`
    log.info('Database connection test successful')
    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    log.error({ error: errorMessage }, 'Database connection test failed')
    return { success: false, error: errorMessage }
  }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    log.info('Database disconnected successfully')
  } catch (error) {
    log.error({ error }, 'Failed to disconnect from database')
  }
}
