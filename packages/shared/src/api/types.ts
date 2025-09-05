/**
 * 共通API型定義
 *
 * Phase 4 移行: 言語中立メッセージシステムとの統合
 * 全APIレスポンスで一貫した型安全性を提供
 */

import { MessageKey, ValidationMessageKey } from '../messages/keys'

/**
 * APIエラーレスポンス
 *
 * @description 全APIエラーレスポンスの標準形式
 * - `success: false` で失敗を明示
 * - `code` でメッセージキーを提供（翻訳はクライアント側で実施）
 * - `message` は段階移行期・デバッグ用（将来削除予定）
 */
export interface ApiErrorResponse {
  /** 常に false - 型レベルでエラーレスポンスを識別 */
  success: false

  /** メッセージレジストリのキー - UI側で翻訳される */
  code: MessageKey

  /**
   * オプショナルメッセージ（段階移行期のみ）
   * - 開発環境：デバッグ用フォールバック
   * - 本番環境：将来的に削除予定
   */
  message?: string

  /** 追加エラー詳細（バリデーションエラー等） */
  details?: unknown

  /** HTTP ステータスコード（参考情報） */
  status?: number
}

/**
 * API成功レスポンス
 *
 * @template T レスポンスデータの型
 */
export interface ApiSuccessResponse<T = unknown> {
  /** 常に true - 型レベルで成功レスポンスを識別 */
  success: true

  /** 実際のレスポンスデータ */
  data: T

  /** オプショナル成功メッセージキー */
  message?: MessageKey
}

/**
 * 統合APIレスポンス型
 *
 * @template T 成功時のデータ型
 * @description Result型パターン - 成功/失敗を型レベルで判別
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * バリデーションエラーの詳細情報
 */
export interface ValidationError {
  /** エラーが発生したフィールド */
  field: string

  /** バリデーションエラーのメッセージキー */
  code: ValidationMessageKey

  /** フィールド値（デバッグ用） */
  value?: unknown

  /** 追加制約情報 */
  constraints?: Record<string, unknown>
}

/**
 * バリデーションエラー専用レスポンス
 */
export interface ValidationErrorResponse
  extends Omit<ApiErrorResponse, 'code' | 'details'> {
  /** バリデーションエラーを示す固定コード */
  // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
  code: 'error.validation_failed'

  /** 各フィールドのバリデーションエラー詳細 */
  details: {
    /** フィールド別エラー配列 */
    errors: ValidationError[]

    /** 失敗したフィールド数 */
    errorCount: number

    /** 検証対象の総フィールド数 */
    totalFields?: number
  }
}

/**
 * ページネーション情報
 */
export interface PaginationMeta {
  /** 現在のページ（1ベース） */
  page: number

  /** 1ページあたりのアイテム数 */
  limit: number

  /** 総アイテム数 */
  total: number

  /** 総ページ数 */
  totalPages: number

  /** 前のページが存在するか */
  hasPrevious: boolean

  /** 次のページが存在するか */
  hasNext: boolean
}

/**
 * ページネーション対応APIレスポンス
 */
export interface PaginatedApiResponse<T> extends ApiSuccessResponse<T[]> {
  /** ページネーション情報 */
  meta: PaginationMeta
}

// ========================================
// ユーティリティ型・型ガード
// ========================================

/**
 * APIレスポンスの成功判定型ガード
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * APIレスポンスのエラー判定型ガード
 */
export function isApiError(
  response: ApiResponse<unknown>
): response is ApiErrorResponse {
  return response.success === false
}

/**
 * バリデーションエラーレスポンス判定型ガード
 */
export function isValidationError(
  response: ApiResponse<unknown>
): response is ValidationErrorResponse {
  // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
  return isApiError(response) && response.code === 'error.validation_failed'
}

// ========================================
// レスポンス生成ヘルパー関数
// ========================================

/**
 * 成功レスポンスの生成
 */
export function createSuccessResponse<T>(
  data: T,
  message?: MessageKey
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * エラーレスポンスの生成
 *
 * @param code エラーメッセージキー
 * @param details 追加エラー詳細
 * @param status HTTPステータスコード
 * @param fallbackMessage 段階移行期用フォールバックメッセージ
 */
export function createErrorResponse(
  code: MessageKey,
  details?: unknown,
  status?: number,
  fallbackMessage?: string
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    code,
    ...(details !== undefined && { details }),
    ...(status && { status }),
  }

  // 段階移行期：開発環境でのみfallbackMessage使用
  if (process.env['NODE_ENV'] === 'development' && fallbackMessage) {
    response.message = fallbackMessage
  }

  return response
}

/**
 * バリデーションエラーレスポンスの生成
 */
export function createValidationErrorResponse(
  errors: ValidationError[]
): ValidationErrorResponse {
  return {
    success: false,
    // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
    code: 'error.validation_failed',
    details: {
      errors,
      errorCount: errors.length,
      totalFields: new Set(errors.map(e => e.field)).size,
    },
  }
}

/**
 * ページネーション対応レスポンスの生成
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedApiResponse<T> {
  const totalPages = Math.ceil(total / limit)

  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    },
  }
}

// ========================================
// 既存API互換性（段階移行用）
// ========================================

/**
 * 既存APIレスポンスとの互換性を保つ型（段階移行期用）
 * @deprecated Phase 4移行完了後に削除予定
 */
export interface LegacyApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 既存レスポンスから新形式への変換（段階移行用）
 * @deprecated Phase 4移行完了後に削除予定
 */
// eslint-disable-next-line @template/message-keys/require-message-key
export function convertLegacyResponse<T>(
  legacy: LegacyApiResponse<T>,
  errorCode?: MessageKey
): ApiResponse<T> {
  if (legacy.success && legacy.data !== undefined) {
    return createSuccessResponse(legacy.data)
  } else {
    return createErrorResponse(
      // eslint-disable-next-line @template/message-keys/no-hardcoded-messages
      errorCode || 'error.unknown_error',
      undefined,
      undefined,
      legacy.error || legacy.message
    )
  }
}

// ========================================
// 型定義エクスポート
// ========================================

export type { MessageKey, ValidationMessageKey } from '../messages/keys'
