import type { paths } from '@template/api-contracts-ts'
import type { MessageKey } from '@template/shared'
import { MESSAGE_KEYS_BY_NAMESPACE } from '@template/shared'
import createClient from 'openapi-fetch'

import { getApiBaseUrl } from './utils/api-config'

/**
 * 型安全なAPIクライアント
 * OpenAPI仕様から自動生成された型を使用
 */
export const apiClient = createClient<paths>({
  baseUrl: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * ヘルスチェックAPI呼び出し
 * システムの詳細な健全性状態を取得
 */
const UNKNOWN_ERROR_KEY = MESSAGE_KEYS_BY_NAMESPACE.error.unknown_error

export async function getDetailedHealth() {
  const response = await apiClient.GET('/api/health')

  if (!response.data) {
    let errorMessage: MessageKey = UNKNOWN_ERROR_KEY

    if (response.error) {
      const error: unknown = response.error

      if (typeof error === 'string') {
        errorMessage = error.startsWith('error.')
          ? (error as MessageKey)
          : UNKNOWN_ERROR_KEY
      } else if (error && typeof error === 'object') {
        const maybeMessage = (error as { message?: unknown }).message

        if (typeof maybeMessage === 'string') {
          errorMessage = maybeMessage.startsWith('error.')
            ? (maybeMessage as MessageKey)
            : UNKNOWN_ERROR_KEY
        }
      }
    }

    console.error('Failed to fetch detailed health check.', {
      rawError: response.error,
      status: response.response.status,
    })

    throw new Error(errorMessage)
  }

  // 503ステータスでもデータは返ってくる可能性がある
  const isHealthy = response.response.status === 200

  return {
    success: isHealthy,
    data: response.data,
    error: isHealthy ? null : UNKNOWN_ERROR_KEY,
  }
}
