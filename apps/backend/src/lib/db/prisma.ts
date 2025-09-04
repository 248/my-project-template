import { PrismaClient } from '../../../generated/prisma'
import { resolveLoggerService } from '@/container/container'

// Note: DIコンテナが初期化される前に使用される可能性があるため、
// 遅延評価でLoggerServiceを取得
const getLogger = () => resolveLoggerService().child({ name: 'prisma' })

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
    getLogger().debug('Database query executed', {
      query: String(e.query),
      params: String(e.params),
      duration: Number(e.duration),
    })
  })

  prisma.$on('error', e => {
    getLogger().error('Database error occurred', {
      target: String(e.target),
      message: String(e.message),
    })
  })

  prisma.$on('info', e => {
    getLogger().info('Database info', {
      target: String(e.target),
      message: String(e.message),
    })
  })

  prisma.$on('warn', e => {
    getLogger().warn('Database warning', {
      target: String(e.target),
      message: String(e.message),
    })
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
 * Prismaクライアントを取得（DIサービス用）
 */
export function getDb(): PrismaClient {
  return prisma
}

/**
 * データベースから切断（DIサービス用）
 */
export async function disconnectDb(): Promise<void> {
  await disconnectDatabase()
}

/**
 * データベース接続をテスト
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`
    getLogger().info('Database connection test successful')
    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    getLogger().error('Database connection test failed', {
      error: errorMessage,
    })
    return { success: false, error: errorMessage }
  }
}

/**
 * アプリケーション終了時のクリーンアップ
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
    getLogger().info('Database disconnected successfully')
  } catch (error) {
    getLogger().error('Failed to disconnect from database', { error })
  }
}
