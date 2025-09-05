/* eslint-disable @template/message-keys/no-hardcoded-messages */
'use client'

import React, { useState } from 'react'
import { getDetailedHealth } from '@/lib/api'
import type { DetailedHealthCheck } from '@template/api-contracts-ts'

interface HealthCheckState {
  isLoading: boolean
  data: DetailedHealthCheck | null
  error: string | null
  lastChecked: Date | null
}

/**
 * ヘルスチェックボタンコンポーネント
 * システムの健全性状態を確認し、結果を表示
 */
export function HealthCheckButton() {
  const [state, setState] = useState<HealthCheckState>({
    isLoading: false,
    data: null,
    error: null,
    lastChecked: null,
  })

  /**
   * ヘルスチェック実行
   */
  const handleHealthCheck = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await getDetailedHealth()

      setState({
        isLoading: false,
        data: result.data,
        error: result.success ? null : 'サービスに問題が発生しています',
        lastChecked: new Date(),
      })
    } catch (error) {
      setState({
        isLoading: false,
        data: null,
        error: error instanceof Error ? error.message : 'エラーが発生しました',
        lastChecked: new Date(),
      })
    }
  }

  /**
   * ステータスに応じたスタイルクラスを取得
   */
  const getStatusClass = (status?: string) => {
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
  }

  /**
   * ステータスアイコンを取得
   */
  const getStatusIcon = (status?: string) => {
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
            最終確認: {state.lastChecked.toLocaleTimeString('ja-JP')}
          </p>
        )}

        {state.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-800 font-medium">エラー</p>
            <p className="text-red-700">{state.error}</p>
          </div>
        )}

        {state.data && (
          <div className="mt-6 space-y-4">
            {/* 全体ステータス */}
            <div
              className={`p-4 rounded-md border-2 ${getStatusClass(state.data.status)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">
                  システムステータス: {getStatusIcon(state.data.status)}{' '}
                  {state.data.status}
                </span>
                <span className="text-sm">
                  稼働時間: {Math.floor((state.data.uptime || 0) / 3600)}時間
                  {Math.floor(((state.data.uptime || 0) % 3600) / 60)}分
                </span>
              </div>
            </div>

            {/* サービス個別ステータス */}
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-bold mb-3">サービス状態</h3>
              <div className="space-y-2">
                {Object.entries(state.data.services).map(([name, service]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-2 bg-white rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(service.status)}</span>
                      <span className="font-medium capitalize">{name}</span>
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

            {/* システムメトリクス */}
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-bold mb-3">システムメトリクス</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">メモリ使用量</p>
                  <p className="font-mono">
                    {state.data.system.memory.heapUsed} /{' '}
                    {state.data.system.memory.heapTotal} MB
                  </p>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${(state.data.system.memory.heapUsed / state.data.system.memory.heapTotal) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <p className="text-sm text-gray-600">CPU時間</p>
                  <p className="font-mono text-sm">
                    User: {state.data.system.cpu.user}ms
                  </p>
                  <p className="font-mono text-sm">
                    System: {state.data.system.cpu.system}ms
                  </p>
                </div>
              </div>
            </div>

            {/* 環境情報 */}
            <div className="text-sm text-gray-600 flex justify-between">
              <span>バージョン: {state.data.version}</span>
              <span>環境: {state.data.environment}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
