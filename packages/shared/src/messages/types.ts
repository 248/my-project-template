import type { MessageKey } from './keys'

/**
 * Message parameters type definitions (auto-generated)
 *
 * Generated from: contracts/messages/registry.yaml
 * Version: 1.0.0
 * Generated at: 2025-09-06T04:53:32.349Z
 */
export interface MessageParameters {
  'error.unknown_error': { details: string }
  'validation.field_required': { field: string }
  'validation.invalid_email': { email: string }
  'validation.invalid_url': { url: string }
  'validation.string_too_short': { field: string; minLength: number }
  'validation.string_too_long': { field: string; maxLength: number }
}

/**
 * Message key categories (auto-generated)
 */
export type MessageKeyWithParams = keyof MessageParameters
export type MessageKeyWithoutParams = Exclude<MessageKey, MessageKeyWithParams>

/**
 * Parameter type extraction utility
 */
export type MessageParamsFor<K extends MessageKey> =
  K extends MessageKeyWithParams ? MessageParameters[K] : never

/**
 * Supported locales (from registry)
 */
export type SupportedLocale = 'ja' | 'en' | 'pseudo'

/**
 * Locale messages type
 */
export type LocaleMessages = Record<MessageKey, string>

/**
 * Message getter function types
 */
export interface MessageGetter {
  <K extends MessageKeyWithoutParams>(key: K): string
  <K extends MessageKeyWithParams>(key: K, params: MessageParameters[K]): string
}

/**
 * API Response types (enhanced with registry data)
 */
export interface ApiResponseWithCode {
  success: boolean
  code: MessageKey
  message?: string // Optional for backward compatibility
  data?: unknown
}

export interface MessageApiErrorResponse {
  success: false
  code: Extract<
    MessageKey,
    `error.${string}` | `auth.${string}` | `validation.${string}`
  >
  message?: string
  details?: unknown
}

export interface MessageApiSuccessResponse<T = unknown> {
  success: true
  code: Extract<MessageKey, `success.${string}`>
  message?: string
  data?: T
}

/**
 * Validation error types
 */
export interface ValidationErrorDetail {
  field: string
  code: Extract<MessageKey, `validation.${string}`>
  message: string
}

export interface MessageValidationErrorResponse
  extends MessageApiErrorResponse {
  code: 'error.validation_failed'
  errors: ValidationErrorDetail[]
}
