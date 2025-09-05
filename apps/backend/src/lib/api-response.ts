/**
 * バックエンド専用APIレスポンスヘルパー
 * ESMモジュール解決問題の緊急回避用
 */

export interface ApiErrorResponse {
  success: false
  code: string
  message?: string
  details?: unknown
  status?: number
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  code?: string
  data: T
  message?: string
}

export interface ValidationError {
  field: string
  code: string
  message: string
}

export interface ValidationErrorResponse
  extends Omit<ApiErrorResponse, 'details'> {
  code: 'error.validation_failed'
  errors: ValidationError[]
}

export function createSuccessResponse<T>(
  data: T,
  code?: string,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(code && { code }),
    ...(message && { message }),
  }
}

export function createErrorResponse(
  code: string,
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

  if (process.env['NODE_ENV'] === 'development' && fallbackMessage) {
    response.message = fallbackMessage
  }

  return response
}

export function createValidationErrorResponse(
  errors: ValidationError[],
  message?: string
): ValidationErrorResponse {
  return {
    success: false,
    code: 'error.validation_failed',
    errors,
    ...(message && { message }),
  }
}

export type ValidationMessageKey = string
