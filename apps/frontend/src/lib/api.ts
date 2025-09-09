import type { paths } from '@template/api-contracts-ts'
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
export async function getDetailedHealth() {
  const response = await apiClient.GET('/api/health')

  if (!response.data) {
    // エラーの場合
    let errorMessage = 'Health check failed'

    if (response.error) {
      // エラーオブジェクトの内容を安全に文字列化
      const error: unknown = response.error
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        // エラーオブジェクトを文字列化
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = 'Unknown error occurred'
        }
      }
    }

    throw new Error(errorMessage)
  }

  // 503ステータスでもデータは返ってくる可能性がある
  const isHealthy = response.response.status === 200

  return {
    success: isHealthy,
    data: response.data,
    error: isHealthy ? null : 'サービスに問題が発生しています',
  }
}
