/**
 * Workers環境用APIレスポンスヘルパー
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

  // Workers環境では process.env がない場合があるため、NODE_ENV を直接確認
  if (fallbackMessage) {
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

/**
 * ZodエラーコードをValidationMessageKeyにマッピング
 */
export function mapZodErrorToValidationCode(
  zodErrorCode: string
): ValidationMessageKey {
  switch (zodErrorCode) {
    case 'invalid_type':
    case 'required':
      return 'validation.field_required'
    case 'invalid_string':
      return 'validation.invalid_email'
    case 'too_small':
      return 'validation.string_too_short'
    case 'too_big':
      return 'validation.string_too_long'
    default:
      return 'validation.field_required'
  }
}
