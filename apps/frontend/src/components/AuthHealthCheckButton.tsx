'use client'
import { getMessageSafe, type MessageKey } from '@template/shared'
import { useState } from 'react'

import { useMessages } from '@/hooks/useMessages'
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
  const { tError, tUI, t, locale } = useMessages()

  const [state, setState] = useState<ComponentState>({
    isLoading: false,
    result: null,
    lastUpdated: null,
  })

  const isMessageKey = (value: string): value is MessageKey => {
    return value.startsWith('error.') || value.startsWith('auth.')
  }

  const resolveApiErrorMessage = (message: string): string => {
    if (isMessageKey(message)) {
      return getMessageSafe(message, locale)
    }

    return message
  }

  /**
   * 認証付きAPIテスト実行
   */
  const handleTest = async () => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
    }))

    try {
      // 認証状態を確認
      if (!api.checkAuthState()) {
        setState({
          isLoading: false,
          result: {
            success: false,
            data: null,
            error: {
              message: tError('auth.signin_required'),
              status: 401,
            },
          },
          lastUpdated: new Date(),
        })
        return
      }

      const healthResult = await api.healthCheck()
      if (!healthResult.success) {
        setState({
          isLoading: false,
          result: healthResult,
          lastUpdated: new Date(),
        })
        return
      }

      const ensureResult = await api.ensureUser()
      if (!ensureResult.success) {
        setState({
          isLoading: false,
          result: ensureResult,
          lastUpdated: new Date(),
        })
        return
      }

      const profileResult = await api.getProfile()
      setState({
        isLoading: false,
        result: profileResult,
        lastUpdated: new Date(),
      })
    } catch (error) {
      setState({
        isLoading: false,
        result: {
          success: false,
          data: null,
          error: {
            message: 'error.unknown_error',
            status: 500,
            details: error instanceof Error ? error.message : String(error),
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
        {t('action.error_occurred')}
      </h4>
      <div className="text-sm text-red-700 space-y-1">
        <p>
          <strong>{tUI('action.error_details')}:</strong>{' '}
          {resolveApiErrorMessage(error.message)}
        </p>
        <p>
          <strong>{tUI('ui.http_status')}:</strong> {error.status}
        </p>
        {error.details != null && (
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">
              {tUI('action.error_details')}
            </summary>
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
      <h4 className="text-sm font-medium text-green-800 mb-2">
        {tUI('action.health_check_success')}
      </h4>
      <details className="text-sm text-green-700">
        <summary className="cursor-pointer font-medium">
          {tUI('action.response_data')}
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
          {state.isLoading ? tUI('ui.loading') : tUI('action.auth_api_test')}
        </button>

        {state.lastUpdated && (
          <span className="text-sm text-gray-500">
            {tUI('ui.last_execution')}:{' '}
            {state.lastUpdated.toLocaleTimeString('ja-JP')}
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
