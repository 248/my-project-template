import createClient from 'openapi-fetch'
import type { paths } from '@template/api-contracts-ts'

/**
 * APIベースURLを取得
 * 環境変数が設定されていない場合はエラーを投げる
 */
function getApiBaseUrl(): string {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL']
  
  if (!baseUrl) {
    throw new Error(
      '🚨 NEXT_PUBLIC_API_BASE_URL環境変数が設定されていません。' +
      '\n開発環境: http://localhost:8787' +
      '\n本番環境: https://your-workers-api.workers.dev' +
      '\n.env.localファイルまたはVercel環境変数で設定してください。'
    )
  }
  
  return baseUrl
}

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
