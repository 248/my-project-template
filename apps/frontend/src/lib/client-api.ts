'use client'

import { useAuth } from '@clerk/nextjs'
import createClient from 'openapi-fetch'
import type { paths, components } from '@template/api-contracts-ts'

/**
 * APIベースURL設定
 */
const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:8080'

/**
 * Result型パターンによるエラーハンドリング
 */
export type ApiResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

export interface ApiError {
  message: string
  status: number
  details?: unknown
}

/**
 * APIレスポンス型定義
 */
type UserResponse = components['schemas']['UserResponse']
type UserUpdateData = components['schemas']['UserUpdateData']
type HealthCheck = components['schemas']['HealthCheck']

/**
 * クライアントサイド用型安全APIクライアント
 *
 * 特徴:
 * - React hooks使用
 * - Result型によるエラーハンドリング
 * - 生成された型定義を使用
 * - JWT認証の自動付与
 * - 型ガード関数による安全な型変換
 */
export function useApiClient() {
  const { getToken, isSignedIn } = useAuth()

  const client = createClient<paths>({
    baseUrl: API_BASE_URL,
  })

  /**
   * エラーレスポンスの詳細を安全に変換
   */
  const formatErrorDetails = (error: unknown): unknown => {
    if (error === null || error === undefined) {
      return null
    }
    return error
  }

  /**
   * 認証ヘッダーを取得
   */
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    // ClerkのJWTテンプレート'backend'を使用（"aud": "api"クレーム付き）
    const token = await getToken({ template: 'backend' })

    if (!token) {
      throw new Error('ユーザーがサインインしていません。認証が必要です。')
    }

    return { Authorization: `Bearer ${token}` }
  }

  /**
   * 認証状態を確認
   */
  const checkAuthState = (): boolean => {
    return isSignedIn || false
  }

  /**
   * 型ガード: UserResponse型の検証
   */
  const isUserResponse = (data: unknown): data is UserResponse => {
    if (data === null || typeof data !== 'object') {
      return false
    }

    if (!('success' in data) || typeof data.success !== 'boolean') {
      return false
    }

    if (
      !('data' in data) ||
      data.data === null ||
      typeof data.data !== 'object'
    ) {
      return false
    }

    const dataObj = data.data
    return 'user' in dataObj
  }

  /**
   * 型ガード: HealthCheck型の検証
   */
  const isHealthCheck = (data: unknown): data is HealthCheck => {
    return (
      data !== null &&
      typeof data === 'object' &&
      'message' in data &&
      'version' in data &&
      'status' in data &&
      'timestamp' in data
    )
  }

  /**
   * ユーザーを冪等に作成/同期
   */
  const ensureUser = async (): Promise<ApiResult<UserResponse>> => {
    try {
      const headers = await getAuthHeaders()
      const response = await client.POST('/api/auth/users/ensure', {
        headers,
      })

      if (response.error) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Failed to ensure user',
            status: 500,
            details: formatErrorDetails(
              'error' in response ? response.error : null
            ),
          },
        }
      }

      if (!isUserResponse(response.data)) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Invalid response format',
            status: 500,
          },
        }
      }

      return {
        success: true,
        data: response.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
        },
      }
    }
  }

  /**
   * 現在のユーザープロフィールを取得
   */
  const getProfile = async (): Promise<ApiResult<UserResponse>> => {
    try {
      const headers = await getAuthHeaders()
      const response = await client.GET('/api/users/me', {
        headers,
      })

      if (response.error) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Failed to get profile',
            status: 500,
            details: formatErrorDetails(
              'error' in response ? response.error : null
            ),
          },
        }
      }

      if (!isUserResponse(response.data)) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Invalid response format',
            status: 500,
          },
        }
      }

      return {
        success: true,
        data: response.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
        },
      }
    }
  }

  /**
   * ユーザープロフィールを更新
   */
  const updateProfile = async (
    data: UserUpdateData
  ): Promise<ApiResult<UserResponse>> => {
    try {
      const headers = await getAuthHeaders()
      const response = await client.PUT('/api/users/me', {
        headers,
        body: data,
      })

      if (response.error) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Failed to update profile',
            status: 500,
            details: formatErrorDetails(
              'error' in response ? response.error : null
            ),
          },
        }
      }

      if (!isUserResponse(response.data)) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Invalid response format',
            status: 500,
          },
        }
      }

      return {
        success: true,
        data: response.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
        },
      }
    }
  }

  /**
   * 基本ヘルスチェック
   */
  const healthCheck = async (): Promise<ApiResult<HealthCheck>> => {
    try {
      const response = await client.GET('/')
      const responseError = 'error' in response ? response.error : null

      if (responseError) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Health check failed',
            status: 500,
            details: formatErrorDetails(responseError),
          },
        }
      }

      if (!isHealthCheck(response.data)) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Invalid response format',
            status: 500,
          },
        }
      }

      return {
        success: true,
        data: response.data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          status: 500,
        },
      }
    }
  }

  return {
    ensureUser,
    getProfile,
    updateProfile,
    healthCheck,
    checkAuthState,
  }
}
