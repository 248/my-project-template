import type { MessageKey } from './keys'

/**
 * Message parameters type definitions (auto-generated)
 *
 * Generated from: tools/message-codegen/__tests__/fixtures/test-registry.yaml
 * Version: 1.0.0
 * Generated at: 2025-09-05T13:42:23.341Z
 */
export interface MessageParameters {}

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
 * Note: Primary API response types are defined in ../api/types.ts
 */
export interface ApiResponseWithCode {
  success: boolean
  code: MessageKey
  message?: string // Optional for backward compatibility
  data?: unknown
}
