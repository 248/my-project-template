import type { SupportedLocale, LocaleMessages } from '../types'
import { jaMessages } from './ja'
import { enMessages } from './en'
import { pseudoMessages } from './pseudo'

/**
 * 全ロケールメッセージのマップ
 */
export const localeMessages: Record<SupportedLocale, LocaleMessages> = {
  ja: jaMessages,
  en: enMessages,
  pseudo: pseudoMessages,
}

/**
 * サポートするロケール一覧
 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['ja', 'en', 'pseudo']

/**
 * デフォルトロケール
 */
export const DEFAULT_LOCALE: SupportedLocale = 'ja'

/**
 * フォールバックロケール（メッセージが見つからない場合）
 */
export const FALLBACK_LOCALE: SupportedLocale = 'ja'

/**
 * フォールバック順序（プライマリ→セカンダリ）
 * 重複を避けながら配列化して順序を保持する
 */
export const FALLBACK_SEQUENCE: SupportedLocale[] = Array.from(
  new Set<SupportedLocale>([FALLBACK_LOCALE, 'en'])
)

/**
 * ロケールの有効性チェック
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

/**
 * ロケール正規化（無効なロケールはデフォルトにフォールバック）
 */
export function normalizeLocale(locale?: string): SupportedLocale {
  if (!locale) return DEFAULT_LOCALE

  // 言語コード部分のみ抽出（ja-JP -> ja）
  const langCode = locale.toLowerCase().split('-')[0] || DEFAULT_LOCALE

  return isValidLocale(langCode) ? langCode : DEFAULT_LOCALE
}

/**
 * ブラウザ言語設定からの自動検出
 */
export function detectBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE

  const browserLang = navigator.language || navigator.languages?.[0]
  return normalizeLocale(browserLang || '')
}

/**
 * Accept-Language ヘッダーからの言語検出
 */
export function parseAcceptLanguage(acceptLanguage: string): SupportedLocale {
  // Accept-Language: ja-JP,ja;q=0.9,en;q=0.8 の形式をパース
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, qStr] = lang.trim().split(';q=')
      const quality = qStr ? parseFloat(qStr) : 1.0
      return { locale: locale?.trim() || '', quality }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { locale } of languages) {
    if (locale) {
      const normalized = normalizeLocale(locale)
      if (normalized !== DEFAULT_LOCALE || locale.startsWith('ja')) {
        return normalized
      }
    }
  }

  return DEFAULT_LOCALE
}
