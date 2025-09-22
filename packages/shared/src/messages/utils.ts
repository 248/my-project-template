import type { MessageKey } from './keys'
import type {
  SupportedLocale,
  MessageParameters,
  MessageKeyWithParams,
} from './types'
import { localeMessages, FALLBACK_LOCALE, FALLBACK_SEQUENCE } from './locales'

/**
 * メッセージ補間のためのパラメータ置換
 *
 * テンプレート文字列の {{key}} を params の値で置換
 */
export function interpolateMessage(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key]
    return value !== undefined ? String(value) : match
  })
}

/**
 * 安全なメッセージ取得
 *
 * - 指定されたロケールでメッセージを取得
 * - 見つからない場合はフォールバックロケールを試行
 * - それでも見つからない場合はキー自体を返す
 */
export function getMessageSafe(
  key: MessageKey,
  locale: SupportedLocale,
  params?: Record<string, string | number>
): string {
  // 指定されたロケールで取得を試行
  let template = localeMessages[locale]?.[key]

  // フォールバック試行（プライマリ→セカンダリの順で探索）
  if (!template) {
    for (const fallbackLocale of FALLBACK_SEQUENCE) {
      if (fallbackLocale === locale) continue

      const fallbackTemplate = localeMessages[fallbackLocale]?.[key]
      if (fallbackTemplate) {
        template = fallbackTemplate
        break
      }
    }
  }

  // それでも見つからない場合はキーを返す
  if (!template) {
    console.warn(`Message not found for key: ${key} (locale: ${locale})`)
    return key
  }

  return interpolateMessage(template, params)
}

/**
 * 開発モード用の厳密なメッセージ取得
 *
 * メッセージが見つからない場合はエラーを投げる
 */
export function getMessageStrict(
  key: MessageKey,
  locale: SupportedLocale,
  params?: Record<string, string | number>
): string {
  const template = localeMessages[locale]?.[key]

  if (!template) {
    throw new Error(`Message not found for key: ${key} (locale: ${locale})`)
  }

  return interpolateMessage(template, params)
}

/**
 * 型安全なメッセージ取得関数の作成
 */
export function createMessageGetter(
  locale: SupportedLocale,
  strict: boolean = process.env['NODE_ENV'] === 'development'
) {
  const getter = strict ? getMessageStrict : getMessageSafe

  return {
    /**
     * パラメータなしメッセージ取得
     */
    get<K extends Exclude<MessageKey, MessageKeyWithParams>>(key: K): string {
      return getter(key, locale)
    },

    /**
     * パラメータありメッセージ取得
     */
    getWithParams<K extends MessageKeyWithParams>(
      key: K,
      params: MessageParameters[K]
    ): string {
      return getter(key, locale, params as Record<string, string | number>)
    },

    /**
     * 汎用メッセージ取得（型チェック緩い）
     */
    getAny(key: MessageKey, params?: Record<string, string | number>): string {
      return getter(key, locale, params)
    },
  }
}

/**
 * メッセージキーの存在チェック
 */
export function hasMessage(key: MessageKey, locale: SupportedLocale): boolean {
  return key in (localeMessages[locale] || {})
}

/**
 * 指定ロケールで未定義のメッセージキーを取得
 */
export function getMissingKeys(locale: SupportedLocale): MessageKey[] {
  const messages = localeMessages[locale]
  if (!messages) return []

  const referenceKeys = new Set<MessageKey>()
  for (const fallbackLocale of FALLBACK_SEQUENCE) {
    const sourceMessages = localeMessages[fallbackLocale] || {}
    for (const key of Object.keys(sourceMessages)) {
      referenceKeys.add(key as MessageKey)
    }
  }

  return [...referenceKeys].filter(key => !(key in messages))
}

/**
 * 指定ロケールで余剰なメッセージキーを取得
 */
export function getExtraKeys(locale: SupportedLocale): string[] {
  const messages = localeMessages[locale]
  if (!messages) return []

  const referenceKeys = new Set<string>()
  for (const fallbackLocale of FALLBACK_SEQUENCE) {
    const sourceMessages = localeMessages[fallbackLocale] || {}
    for (const key of Object.keys(sourceMessages)) {
      referenceKeys.add(key)
    }
  }

  return Object.keys(messages).filter(key => !referenceKeys.has(key))
}

/**
 * ロケール間のメッセージ整合性チェック
 */
export interface LocaleIntegrityReport {
  locale: SupportedLocale
  missingKeys: MessageKey[]
  extraKeys: string[]
  isValid: boolean
}

export function validateLocaleIntegrity(
  targetLocale: SupportedLocale,
  referenceLocale: SupportedLocale = FALLBACK_LOCALE
): LocaleIntegrityReport {
  const referenceLocales = new Set<SupportedLocale>([
    referenceLocale,
    ...FALLBACK_SEQUENCE,
  ])
  const referenceKeys = new Set<MessageKey>()
  for (const localeKey of referenceLocales) {
    const sourceMessages = localeMessages[localeKey] || {}
    for (const key of Object.keys(sourceMessages)) {
      referenceKeys.add(key as MessageKey)
    }
  }
  const targetMessages = localeMessages[targetLocale] || {}
  const targetKeys = new Set<MessageKey>(
    Object.keys(targetMessages) as MessageKey[]
  )

  const missingKeys = [...referenceKeys].filter(
    key => !targetKeys.has(key)
  ) as MessageKey[]
  const extraKeys = [...targetKeys].filter(key => !referenceKeys.has(key))

  return {
    locale: targetLocale,
    missingKeys,
    extraKeys,
    isValid: missingKeys.length === 0 && extraKeys.length === 0,
  }
}
