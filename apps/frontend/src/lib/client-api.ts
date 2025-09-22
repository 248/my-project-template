'use client'

import { useAuth } from '@clerk/nextjs'
import type { paths, components } from '@template/api-contracts-ts'
import type { MessageKey } from '@template/shared'
import { MESSAGE_KEYS_BY_NAMESPACE } from '@template/shared'
import createClient from 'openapi-fetch'

import { getApiBaseUrl } from './utils/api-config'

const API_BASE_URL = getApiBaseUrl()
const MESSAGE_KEYS = MESSAGE_KEYS_BY_NAMESPACE
const UNKNOWN_ERROR_KEY = MESSAGE_KEYS.error.unknown_error
const AUTH_SIGNIN_REQUIRED_KEY = MESSAGE_KEYS.auth.signin_required
const AUTH_ENSURE_FAILED_KEY = MESSAGE_KEYS.auth.ensure_failed

// API path constants (not user-facing strings)
// eslint-disable-next-line @template/message-keys/no-hardcoded-messages
export const ENSURE_USER_ENDPOINT = '/api/auth/users/ensure' as const

class AuthError extends Error {
  readonly code: MessageKey

  constructor(code: MessageKey) {
    super(code)
    this.name = 'AuthError'
    this.code = code
  }
}

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

  const buildAbsoluteUrl = (path: string): string => {
    try {
      return new URL(path, API_BASE_URL).toString()
    } catch {
      return path
    }
  }

  const createApiError = (
    error: unknown,
    status = 500,
    fallback: MessageKey = UNKNOWN_ERROR_KEY
  ): ApiError => {
    if (error instanceof AuthError) {
      return {
        message: error.code,
        status: 401,
      }
    }

    const details = formatErrorDetails(error)

    return {
      message: fallback,
      status,
      ...(details ? { details } : {}),
    }
  }

  /**
   * 認証ヘッダーを取得
   */
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    // ClerkのJWTテンプレート'backend'を使用（"aud": "api"クレーム付き）
    const token = await getToken({ template: 'backend' })

    if (!token) {
      throw new AuthError(AUTH_SIGNIN_REQUIRED_KEY)
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
      const response = await client.POST(ENSURE_USER_ENDPOINT, {
        headers,
      })

      if (response.error) {
        return {
          success: false,
          data: null,
          error: {
            message: AUTH_ENSURE_FAILED_KEY,
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
            message: 'error.invalid_response_format',
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
        error: createApiError(error),
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
            message: 'error.profile_retrieval_failed',
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
            message: 'error.invalid_response_format',
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
        error: createApiError(error),
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
            message: 'error.profile_update_failed',
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
            message: 'error.invalid_response_format',
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
        error: createApiError(error),
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
            message: UNKNOWN_ERROR_KEY,
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
            message: 'error.invalid_response_format',
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
        error: createApiError(error),
      }
    }
  }

  const simpleHealthCheck = async (): Promise<ApiResult<unknown>> => {
    try {
      const response = await fetch(buildAbsoluteUrl('/health'))
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        return {
          success: false,
          data: null,
          error: {
            message: UNKNOWN_ERROR_KEY,
            status: response.status,
            details: data,
          },
        }
      }

      return {
        success: true,
        data,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: createApiError(error),
      }
    }
  }

  return {
    ensureUser,
    getProfile,
    updateProfile,
    healthCheck,
    simpleHealthCheck,
    checkAuthState,
  }
}
