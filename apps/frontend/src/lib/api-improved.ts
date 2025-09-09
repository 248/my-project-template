import type { paths, DetailedHealthCheck } from '@template/api-contracts-ts'
import createClient from 'openapi-fetch'

import { getApiBaseUrl } from './utils/api-config'

// 型を再エクスポート
export type { DetailedHealthCheck }

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
 * Result型パターンによる成功・失敗の明示的な処理
 */
export type ApiResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: ApiError }

/**
 * APIエラーの型定義
 */
export interface ApiError {
  code: string
  message: string
  details?: unknown
  statusCode?: number
}

/**
 * 型安全なプロパティアクセスのための型定義
 */
interface ErrorWithMessage {
  message: unknown
  code?: unknown
}

function isErrorWithMessage(err: unknown): err is ErrorWithMessage {
  return typeof err === 'object' && err !== null && 'message' in err
}

/**
 * HTTPエラーレスポンスからAPIErrorを作成
 */
function createApiError(error: unknown, statusCode?: number): ApiError {
  // 型ガードによる安全な型判定
  if (typeof error === 'string') {
    return {
      code: 'API_ERROR',
      message: error,
      statusCode,
    }
  }

  if (isErrorWithMessage(error)) {
    const code = typeof error.code === 'string' ? error.code : 'API_ERROR'
    const message =
      typeof error.message === 'string' ? error.message : 'Unknown error'

    return {
      code,
      message,
      details: error,
      statusCode,
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: error,
    statusCode,
  }
}

/**
 * ヘルスチェックAPI呼び出し（改善版）
 * Result型を使用した型安全なエラーハンドリング
 */
export async function getDetailedHealth(): Promise<
  ApiResult<DetailedHealthCheck>
> {
  try {
    const response = await apiClient.GET('/api/health')

    if (!response.data) {
      // エラーレスポンスの場合
      return {
        success: false,
        data: null,
        error: createApiError(response.error, response.response.status),
      }
    }

    // 成功レスポンスの場合（200または503どちらでもdataがある）
    return {
      success: true,
      data: response.data,
      error: null,
    }
  } catch (error) {
    // ネットワークエラーやその他の例外
    return {
      success: false,
      data: null,
      error: createApiError(error),
    }
  }
}

/**
 * ヘルスチェック結果の判定ユーティリティ
 */
export const HealthCheckUtils = {
  /**
   * システム全体が健全かどうか判定
   */
  isSystemHealthy(health: DetailedHealthCheck): boolean {
    return health.status === 'healthy'
  },

  /**
   * システムが劣化状態かどうか判定
   */
  isSystemDegraded(health: DetailedHealthCheck): boolean {
    return health.status === 'degraded'
  },

  /**
   * システムが異常状態かどうか判定
   */
  isSystemUnhealthy(health: DetailedHealthCheck): boolean {
    return health.status === 'unhealthy'
  },

  /**
   * 必要なサービスが全て稼働しているかチェック
   */
  areEssentialServicesUp(health: DetailedHealthCheck): boolean {
    // APIサービスとDatabaseサービスは必須と仮定
    const apiService = health.services.api
    const dbService = health.services.database

    return apiService?.status === 'healthy' && dbService?.status === 'healthy'
  },

  /**
   * システム稼働時間を人間が読める形式に変換
   */
  formatUptime(uptimeSeconds: number): string {
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60

    if (hours > 0) {
      return `${hours}時間${minutes}分`
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`
    } else {
      return `${seconds}秒`
    }
  },

  /**
   * メモリ使用率を計算
   */
  getMemoryUsagePercentage(health: DetailedHealthCheck): number {
    const { heapUsed, heapTotal } = health.system.memory
    if (heapTotal === 0) return 0
    return Math.round((heapUsed / heapTotal) * 100)
  },
} as const
