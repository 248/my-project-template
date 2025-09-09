import { inject, injectable } from 'tsyringe'

import { PrismaClient } from '../../generated/prisma'
import { type LoggerService, SERVICE_TOKENS } from '../interfaces'
import { type AuthContext } from '../middleware/clerk-auth'

// ユーザー更新データの型
export interface UserUpdateData {
  displayName?: string
  email?: string
  avatarUrl?: string
  locale?: string
}

// ユーザー作成/更新結果の型
export interface UserResult {
  id: string
  displayName: string | null
  email: string | null
  avatarUrl: string | null
  locale: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * ユーザー管理サービス
 *
 * 機能:
 * - ユーザーの作成・更新（冪等）
 * - ユーザー情報の取得
 * - プロフィールの更新
 */
@injectable()
export class UserService {
  constructor(
    @inject('PrismaClient') private readonly prisma: PrismaClient,
    @inject(SERVICE_TOKENS.LOGGER) private readonly logger: LoggerService
  ) {}

  /**
   * ユーザーを冪等に作成/同期
   * 既存ユーザーの場合は情報を更新、新規の場合は作成
   *
   * @param userId ClerkのユーザーID
   * @param userData 更新するユーザーデータ
   * @returns 作成/更新されたユーザー
   */
  async ensureUser(
    userId: string,
    userData?: Partial<UserUpdateData>
  ): Promise<UserResult> {
    this.logger.info(`Ensuring user exists: ${userId}`)

    try {
      const user = await this.prisma.user.upsert({
        where: { id: userId },
        update: userData ?? {},
        create: {
          id: userId,
          displayName: userData?.displayName || null,
          email: userData?.email || null,
          avatarUrl: userData?.avatarUrl || null,
          locale: userData?.locale || 'ja',
        },
      })

      this.logger.info(`User ensured successfully: ${userId}`)
      return user
    } catch (error) {
      this.logger.error(`Failed to ensure user: ${userId}`, { error })
      throw new Error(
        `Failed to ensure user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * ユーザー情報を取得
   *
   * @param userId ユーザーID
   * @returns ユーザー情報（存在しない場合はnull）
   */
  async getUser(userId: string): Promise<UserResult | null> {
    this.logger.debug(`Getting user: ${userId}`)

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      return user
    } catch (error) {
      this.logger.error(`Failed to get user: ${userId}`, { error })
      throw new Error(
        `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * ユーザープロフィールを更新
   *
   * @param userId ユーザーID
   * @param userData 更新データ
   * @returns 更新されたユーザー情報
   */
  async updateUser(
    userId: string,
    userData: UserUpdateData
  ): Promise<UserResult> {
    this.logger.info(`Updating user: ${userId}`)

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      })

      this.logger.info(`User updated successfully: ${userId}`)
      return user
    } catch (error) {
      // Prisma P2025 エラー（レコードが見つからない）を型安全に処理
      if (this.isPrismaNotFoundError(error)) {
        this.logger.warn(`User not found for update: ${userId}`)
        throw new Error('User not found')
      }

      this.logger.error(`Failed to update user: ${userId}`, { error })
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * 認証コンテキストからユーザー情報を取得
   *
   * @param auth 認証コンテキスト
   * @returns ユーザー情報
   */
  async getUserFromAuth(auth: AuthContext): Promise<UserResult | null> {
    return this.getUser(auth.userId)
  }

  /**
   * 認証コンテキストからユーザーを確実に作成/取得
   *
   * @param auth 認証コンテキスト
   * @returns ユーザー情報
   */
  async ensureUserFromAuth(auth: AuthContext): Promise<UserResult> {
    return this.ensureUser(auth.userId)
  }

  /**
   * Prisma P2025エラー（レコードが見つからない）の型ガード
   *
   * @param error 検証するエラー
   * @returns P2025エラーかどうか
   */
  private isPrismaNotFoundError(error: unknown): boolean {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    )
  }
}
