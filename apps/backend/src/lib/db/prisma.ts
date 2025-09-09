import { PrismaClient } from '../../../generated/prisma'

// Note: 循環依存を避けるため、Prismaクライアント層では直接ログ出力を使用
// 個別サービス層（PrismaDatabaseService）でのログ管理を推奨

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

  // ログイベントのハンドリング（循環依存を避けるためconsole出力）
  prisma.$on('query', e => {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug('Database query executed', {
        query: String(e.query),
        params: String(e.params),
        duration: Number(e.duration),
      })
    }
  })

  prisma.$on('error', e => {
    console.error('Database error occurred', {
      target: String(e.target),
      message: String(e.message),
    })
  })

  prisma.$on('info', e => {
    console.info('Database info', {
      target: String(e.target),
      message: String(e.message),
    })
  })

  prisma.$on('warn', e => {
    console.warn('Database warning', {
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
    console.info('Database connection test successful')
    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    console.error('Database connection test failed', {
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
    console.info('Database disconnected successfully')
  } catch (error) {
    console.error('Failed to disconnect from database', { error })
  }
}
