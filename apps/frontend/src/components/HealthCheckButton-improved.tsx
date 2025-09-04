'use client'

import { useState, useCallback } from 'react'
import { getDetailedHealth, HealthCheckUtils } from '@/lib/api-improved'
import type { DetailedHealthCheck } from '@/lib/api-improved'
import type { ApiResult, ApiError } from '@/lib/api-improved'

interface HealthCheckState {
  isLoading: boolean
  result: ApiResult<DetailedHealthCheck> | null
  lastChecked: Date | null
}

/**
 * ヘルスチェックボタンコンポーネント（改善版）
 * 型安全なエラーハンドリングと豊富なユーティリティ機能
 */
export function HealthCheckButton() {
  const [state, setState] = useState<HealthCheckState>({
    isLoading: false,
    result: null,
    lastChecked: null,
  })

  /**
   * ヘルスチェック実行
   */
  const handleHealthCheck = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await getDetailedHealth()

      setState({
        isLoading: false,
        result,
        lastChecked: new Date(),
      })
    } catch (error) {
      // このcatchブロックは通常実行されない（getDetailedHealthが例外を投げないため）
      // 予期しないエラーのフォールバック
      setState({
        isLoading: false,
        result: {
          success: false,
          data: null,
          error: {
            code: 'UNEXPECTED_ERROR',
            message:
              error instanceof Error
                ? error.message
                : '予期しないエラーが発生しました',
          },
        },
        lastChecked: new Date(),
      })
    }
  }, [])

  /**
   * ステータスに応じたスタイルクラスを取得
   */
  const getStatusClass = useCallback((status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }, [])

  /**
   * ステータスアイコンを取得
   */
  const getStatusIcon = useCallback((status?: string) => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'degraded':
        return '⚠️'
      case 'unhealthy':
        return '❌'
      default:
        return '❓'
    }
  }, [])

  /**
   * エラー表示コンポーネント
   */
  const ErrorDisplay = ({ error }: { error: ApiError }) => (
    <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
      <h3 className="text-red-800 font-medium mb-2">エラー ({error.code})</h3>
      <p className="text-red-700 mb-2">{error.message}</p>
      {error.statusCode && (
        <p className="text-red-600 text-sm">
          HTTPステータス: {error.statusCode}
        </p>
      )}
      {process.env['NODE_ENV'] === 'development' && error.details && (
        <details className="mt-2">
          <summary className="text-red-600 text-sm cursor-pointer">
            詳細情報（開発用）
          </summary>
          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-x-auto">
            {typeof error.details === 'string'
              ? error.details
              : JSON.stringify(error.details, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )

  /**
   * サービス一覧表示コンポーネント
   */
  const ServicesDisplay = ({ data }: { data: DetailedHealthCheck }) => {
    // 型安全なサービス一覧の作成
    const serviceEntries = [
      { name: 'api', service: data.services.api },
      { name: 'database', service: data.services.database },
      { name: 'redis', service: data.services.redis },
    ].filter(
      (
        entry
      ): entry is {
        name: string
        service: NonNullable<typeof entry.service>
      } => entry.service !== undefined
    )

    return (
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="font-bold mb-3">サービス状態</h3>
        <div className="space-y-2">
          {serviceEntries.map(({ name, service }) => (
            <div
              key={name}
              className="flex items-center justify-between p-2 bg-white rounded"
            >
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(service.status)}</span>
                <span className="font-medium capitalize">{name}</span>
                {service.message && (
                  <span className="text-sm text-gray-500">
                    - {service.message}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span
                  className={`text-sm ${
                    service.status === 'healthy'
                      ? 'text-green-600'
                      : service.status === 'degraded'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {service.status}
                </span>
                {service.responseTime !== undefined && (
                  <span className="text-sm text-gray-500">
                    {service.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /**
   * システムメトリクス表示コンポーネント
   */
  const SystemMetricsDisplay = ({ data }: { data: DetailedHealthCheck }) => {
    const memoryPercentage = HealthCheckUtils.getMemoryUsagePercentage(data)

    return (
      <div className="bg-gray-50 rounded-md p-4">
        <h3 className="font-bold mb-3">システムメトリクス</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded">
            <p className="text-sm text-gray-600">メモリ使用量</p>
            <p className="font-mono">
              {data.system.memory.heapUsed} / {data.system.memory.heapTotal} MB
            </p>
            <div className="mt-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  memoryPercentage > 80
                    ? 'bg-red-500'
                    : memoryPercentage > 60
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${memoryPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{memoryPercentage}%</p>
          </div>
          <div className="bg-white p-3 rounded">
            <p className="text-sm text-gray-600">CPU時間</p>
            <p className="font-mono text-sm">User: {data.system.cpu.user}ms</p>
            <p className="font-mono text-sm">
              System: {data.system.cpu.system}ms
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">システムヘルスチェック</h2>

        <button
          onClick={() => void handleHealthCheck()}
          disabled={state.isLoading}
          className={`
            px-6 py-3 rounded-md font-medium transition-all
            ${
              state.isLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {state.isLoading ? '確認中...' : 'ヘルスチェック実行'}
        </button>

        {state.lastChecked && (
          <p className="mt-2 text-sm text-gray-600">
            最終確認: {state.lastChecked.toLocaleString('ja-JP')}
          </p>
        )}

        {state.result && (
          <>
            {!state.result.success ? (
              <ErrorDisplay error={state.result.error} />
            ) : (
              <div className="mt-6 space-y-4">
                {/* 全体ステータス */}
                <div
                  className={`p-4 rounded-md border-2 ${getStatusClass(state.result.data.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">
                      システムステータス:{' '}
                      {getStatusIcon(state.result.data.status)}{' '}
                      {state.result.data.status}
                    </span>
                    <span className="text-sm">
                      稼働時間:{' '}
                      {HealthCheckUtils.formatUptime(
                        state.result.data.uptime || 0
                      )}
                    </span>
                  </div>

                  {/* 重要なサービスの状態サマリー */}
                  {!HealthCheckUtils.areEssentialServicesUp(
                    state.result.data
                  ) && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm">
                      ⚠️ 重要なサービスに問題があります
                    </div>
                  )}
                </div>

                {/* サービス個別ステータス */}
                <ServicesDisplay data={state.result.data} />

                {/* システムメトリクス */}
                <SystemMetricsDisplay data={state.result.data} />

                {/* 環境情報 */}
                <div className="text-sm text-gray-600 flex justify-between">
                  <span>バージョン: {state.result.data.version}</span>
                  <span>環境: {state.result.data.environment}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
