'use client'

import { useState } from 'react'
import { useApiClient, type ApiResult, type ApiError } from '@/lib/client-api'

/**
 * コンポーネント状態の型定義（実装ガイドライン準拠）
 */
interface ComponentState {
  isLoading: boolean
  result: ApiResult<unknown> | null
  lastUpdated: Date | null
}

/**
 * 認証付きAPIテストボタンコンポーネント
 *
 * 実装ガイドライン準拠:
 * - Result型エラーハンドリング
 * - 統合された状態管理
 * - 型安全なAPI呼び出し
 * - 適切なローディング状態表示
 */
export function AuthHealthCheckButton() {
  const api = useApiClient()

  const [state, setState] = useState<ComponentState>({
    isLoading: false,
    result: null,
    lastUpdated: null,
  })

  /**
   * 認証付きAPIテスト実行
   */
  const handleTest = async () => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
    }))

    try {
      // 基本ヘルスチェック
      const healthResult = await api.healthCheck()

      if (healthResult.success) {
        // ユーザー作成/同期テスト
        const ensureResult = await api.ensureUser()

        if (ensureResult.success) {
          // プロフィール取得テスト
          const profileResult = await api.getProfile()

          setState({
            isLoading: false,
            result: profileResult,
            lastUpdated: new Date(),
          })
        } else {
          setState({
            isLoading: false,
            result: ensureResult,
            lastUpdated: new Date(),
          })
        }
      } else {
        setState({
          isLoading: false,
          result: healthResult,
          lastUpdated: new Date(),
        })
      }
    } catch (error) {
      setState({
        isLoading: false,
        result: {
          success: false,
          data: null,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
          },
        },
        lastUpdated: new Date(),
      })
    }
  }

  /**
   * エラー表示コンポーネント
   */
  const ErrorDisplay = ({ error }: { error: ApiError }) => (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <h4 className="text-sm font-medium text-red-800 mb-2">
        エラーが発生しました
      </h4>
      <div className="text-sm text-red-700 space-y-1">
        <p>
          <strong>メッセージ:</strong> {error.message}
        </p>
        <p>
          <strong>ステータス:</strong> {error.status}
        </p>
        {error.details != null && (
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">詳細情報</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
              {typeof error.details === 'string'
                ? error.details
                : JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )

  /**
   * 成功結果表示コンポーネント
   */
  const SuccessDisplay = ({ data }: { data: unknown }) => (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
      <h4 className="text-sm font-medium text-green-800 mb-2">APIテスト成功</h4>
      <details className="text-sm text-green-700">
        <summary className="cursor-pointer font-medium">
          レスポンスデータ
        </summary>
        <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-auto">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )

  return (
    <div>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            void handleTest()
          }}
          disabled={state.isLoading}
          className={`
            px-4 py-2 rounded-md font-medium text-sm
            ${
              state.isLoading
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {state.isLoading ? '実行中...' : '認証付きAPIテスト'}
        </button>

        {state.lastUpdated && (
          <span className="text-sm text-gray-500">
            最終実行: {state.lastUpdated.toLocaleTimeString('ja-JP')}
          </span>
        )}
      </div>

      {/* 結果表示（Result型パターン） */}
      {state.result &&
        (state.result.success ? (
          <SuccessDisplay data={state.result.data} />
        ) : (
          <ErrorDisplay error={state.result.error} />
        ))}
    </div>
  )
}
