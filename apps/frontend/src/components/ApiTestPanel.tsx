'use client'

import { useState } from 'react'

import { useMessages } from '@/hooks/useMessages'
import {
  useApiClient,
  type ApiResult,
  ENSURE_USER_ENDPOINT,
} from '@/lib/client-api'

interface TestResult {
  endpoint: string
  method: string
  status: 'idle' | 'loading' | 'success' | 'error'
  result?: ApiResult<unknown>
  timestamp?: Date
}

interface ApiTest {
  id: string
  name: string
  endpoint: string
  method: string
  description: string
  requiresAuth: boolean
  testFn: () => Promise<ApiResult<unknown>>
}

export function ApiTestPanel() {
  const api = useApiClient()
  const { tUI, tError } = useMessages()
  const [results, setResults] = useState<Record<string, TestResult>>({})

  // テスト可能なAPIエンドポイント定義
  const apiTests: ApiTest[] = [
    {
      id: 'root-health',
      name: tUI('ui.apitest_root_health_name'),
      endpoint: '/',
      method: 'GET',
      description: tUI('ui.apitest_root_health_description'),
      requiresAuth: false,
      testFn: () => api.healthCheck(),
    },
    {
      id: 'simple-health',
      name: tUI('ui.apitest_simple_health_name'),
      endpoint: '/health',
      method: 'GET',
      description: tUI('ui.apitest_simple_health_description'),
      requiresAuth: false,
      testFn: () => api.simpleHealthCheck(),
    },
    {
      id: 'detailed-health',
      name: tUI('ui.apitest_detailed_health_name'),
      endpoint: '/api/health',
      method: 'GET',
      description: tUI('ui.apitest_detailed_health_description'),
      requiresAuth: false,
      testFn: () => api.healthCheck(),
    },
    {
      id: 'ensure-user',
      name: tUI('ui.apitest_ensure_user_name'),
      // APIパスは開発者向け情報のためメッセージキー対象外
      // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
      endpoint: ENSURE_USER_ENDPOINT,
      method: 'POST',
      description: tUI('ui.apitest_ensure_user_description'),
      requiresAuth: true,
      testFn: () => api.ensureUser(),
    },
    {
      id: 'get-profile',
      name: tUI('ui.apitest_get_profile_name'),
      endpoint: '/api/users/me',
      method: 'GET',
      description: tUI('ui.apitest_get_profile_description'),
      requiresAuth: true,
      testFn: () => api.getProfile(),
    },
    {
      id: 'update-profile',
      name: tUI('ui.apitest_update_profile_name'),
      endpoint: '/api/users/me',
      method: 'PUT',
      description: tUI('ui.apitest_update_profile_description'),
      requiresAuth: true,
      testFn: async () => {
        return api.updateProfile({
          displayName: `${tUI('ui.apitest_test_user_prefix')}_${Date.now()}`,
          locale: 'ja',
        })
      },
    },
  ]

  const runTest = async (test: ApiTest) => {
    const testId = test.id

    // ローディング状態を設定
    setResults(prev => ({
      ...prev,
      [testId]: {
        endpoint: test.endpoint,
        method: test.method,
        status: 'loading',
      },
    }))

    try {
      // 認証が必要なAPIの場合、認証状態をチェック
      if (test.requiresAuth && !api.checkAuthState()) {
        setResults(prev => ({
          ...prev,
          [testId]: {
            endpoint: test.endpoint,
            method: test.method,
            status: 'error',
            result: {
              success: false,
              data: null,
              error: {
                message: tError('auth.signin_required'),
                status: 401,
              },
            },
            timestamp: new Date(),
          },
        }))
        return
      }

      // APIテスト実行
      const result = await test.testFn()

      setResults(prev => ({
        ...prev,
        [testId]: {
          endpoint: test.endpoint,
          method: test.method,
          status: result.success ? 'success' : 'error',
          result,
          timestamp: new Date(),
        },
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testId]: {
          endpoint: test.endpoint,
          method: test.method,
          status: 'error',
          result: {
            success: false,
            data: null,
            error: {
              message: 'error.unknown_error',
              status: 500,
              details: error instanceof Error ? error.message : String(error),
            },
          },
          timestamp: new Date(),
        },
      }))
    }
  }

  const runAllTests = async () => {
    for (const test of apiTests) {
      await runTest(test)
      // 少し間隔を空けて実行
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const LOCK_ICON = '\u{1F512}'

  const statusIcons: Record<TestResult['status'], string> = {
    idle: '\u26AA',
    loading: '\u23F3',
    success: '\u2705',
    error: '\u274C',
  }

  const getStatusIcon = (status: TestResult['status']) => {
    return statusIcons[status] ?? statusIcons.idle
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'loading':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {tUI('ui.apitest_panel_title')}
        </h2>
        <button
          onClick={runAllTests}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {tUI('action.apitest_run_all_tests')}
        </button>
      </div>

      <div className="space-y-3">
        {apiTests.map(test => {
          const result = results[test.id]
          return (
            <div
              key={test.id}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getStatusIcon(result?.status || 'idle')}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {test.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {`${test.method} ${test.endpoint}${test.requiresAuth ? ` ${LOCK_ICON}` : ''}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => runTest(test)}
                  disabled={result?.status === 'loading'}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {result?.status === 'loading'
                    ? tUI('ui.apitest_running_status')
                    : tUI('action.apitest_test_button')}
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-2">{test.description}</p>

              {result && (
                <div
                  className={`mt-2 p-2 rounded text-xs border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {result.status === 'success'
                        ? tUI('ui.apitest_success_status')
                        : result.status === 'error'
                          ? tUI('ui.apitest_error_status')
                          : tUI('ui.apitest_running_status')}
                    </span>
                    {result.timestamp && (
                      <span className="text-xs opacity-75">
                        {result.timestamp.toLocaleTimeString('ja-JP')}
                      </span>
                    )}
                  </div>

                  {result.result && (
                    <details className="mt-1">
                      <summary className="cursor-pointer font-medium">
                        {tUI('ui.apitest_response_details')}
                      </summary>
                      <pre className="mt-1 p-1 bg-black bg-opacity-5 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
