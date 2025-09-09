import { neon } from '@neondatabase/serverless'

import type { AuthContext } from '../middleware/clerk-auth-worker'

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

// データベース行の型
interface UserRow {
  id: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  locale: string | null
  created_at: string
  updated_at: string
}

// Neonクエリ結果の型ガード
function isValidUserResult(result: unknown): result is [UserRow, ...UserRow[]] {
  return (
    Array.isArray(result) &&
    result.length > 0 &&
    typeof result[0] === 'object' &&
    result[0] !== null
  )
}

/**
 * Workers環境用ユーザー管理サービス
 *
 * Neonアダプターを使用してSQL直接実行
 */
export class UserServiceWorker {
  private sql: ReturnType<typeof neon>

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl)
  }

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
    console.log(`Ensuring user exists: ${userId}`)

    try {
      // PostgreSQLのUPSERT構文を使用
      const result = await this.sql`
        INSERT INTO users (
          id, 
          display_name, 
          email, 
          avatar_url, 
          locale,
          created_at,
          updated_at
        ) VALUES (
          ${userId}, 
          ${userData?.displayName || null}, 
          ${userData?.email || null}, 
          ${userData?.avatarUrl || null}, 
          ${userData?.locale || 'ja'},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
          display_name = COALESCE(${userData?.displayName || null}, users.display_name),
          email = COALESCE(${userData?.email || null}, users.email),
          avatar_url = COALESCE(${userData?.avatarUrl || null}, users.avatar_url),
          locale = COALESCE(${userData?.locale || null}, users.locale),
          updated_at = NOW()
        RETURNING 
          id,
          display_name,
          email,
          avatar_url,
          locale,
          created_at,
          updated_at
      `

      if (!isValidUserResult(result)) {
        throw new Error('Failed to upsert user - no result returned')
      }

      const row = result[0]

      const user = {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        locale: row.locale,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }

      console.log(`User ensured successfully: ${userId}`)
      return user
    } catch (error) {
      console.error(`Failed to ensure user: ${userId}`, error)
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
    console.log(`Getting user: ${userId}`)

    try {
      const result = await this.sql`
        SELECT 
          id,
          display_name,
          email,
          avatar_url,
          locale,
          created_at,
          updated_at
        FROM users
        WHERE id = ${userId}
      `

      if (!isValidUserResult(result)) {
        return null
      }

      const row = result[0]
      return {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        locale: row.locale,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }
    } catch (error) {
      console.error(`Failed to get user: ${userId}`, error)
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
    console.log(`Updating user: ${userId}`)

    try {
      if (Object.keys(userData).length === 0) {
        // 更新フィールドがない場合は現在のユーザーを返す
        const user = await this.getUser(userId)
        if (!user) {
          throw new Error('User not found')
        }
        return user
      }

      // Neonではタグドテンプレート形式でSQL実行
      // undefinedでない場合にのみ値を更新（データ損失防止）
      const result = await this.sql`
        UPDATE users 
        SET 
          display_name = CASE WHEN ${userData.displayName !== undefined} THEN ${userData.displayName} ELSE display_name END,
          email = CASE WHEN ${userData.email !== undefined} THEN ${userData.email} ELSE email END,
          avatar_url = CASE WHEN ${userData.avatarUrl !== undefined} THEN ${userData.avatarUrl} ELSE avatar_url END,
          locale = CASE WHEN ${userData.locale !== undefined} THEN ${userData.locale} ELSE locale END,
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING 
          id,
          display_name,
          email,
          avatar_url,
          locale,
          created_at,
          updated_at
      `

      if (!isValidUserResult(result)) {
        throw new Error('User not found')
      }

      const row = result[0]

      const user = {
        id: row.id,
        displayName: row.display_name,
        email: row.email,
        avatarUrl: row.avatar_url,
        locale: row.locale,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }

      console.log(`User updated successfully: ${userId}`)
      return user
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        console.warn(`User not found for update: ${userId}`)
        throw new Error('User not found')
      }

      console.error(`Failed to update user: ${userId}`, error)
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
}
