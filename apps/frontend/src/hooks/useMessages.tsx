'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  type MessageKey,
  type SupportedLocale,
  getMessageSafe,
  detectBrowserLocale,
  DEFAULT_LOCALE,
} from '@template/shared'

/**
 * メッセージ翻訳Hook
 *
 * Phase 4 Step 3: フロントエンドUI移行用
 * - MessageKeyベースの型安全な翻訳
 * - LocalStorage連携での設定永続化
 * - APIレスポンスcode翻訳対応
 * - パラメータ補間サポート
 */

interface MessageHookState {
  locale: SupportedLocale
  isLoading: boolean
}

interface MessageHookReturn {
  /** 現在のロケール */
  locale: SupportedLocale

  /** ロケール変更中かどうか */
  isLoading: boolean

  /** 基本翻訳関数 */
  t: (key: MessageKey, params?: Record<string, string | number>) => string

  /** エラーメッセージ専用翻訳（APIレスポンス用） */
  tError: (code: MessageKey, fallback?: string) => string

  /** 成功メッセージ専用翻訳 */
  tSuccess: (code: MessageKey, fallback?: string) => string

  /** UIラベル専用翻訳 */
  tUI: (code: MessageKey, fallback?: string) => string

  /** アクション・ボタンラベル専用翻訳 */
  tAction: (code: MessageKey, fallback?: string) => string

  /** バリデーションエラー翻訳 */
  tValidation: (
    code: MessageKey,
    params?: Record<string, string | number>
  ) => string

  /** ロケール変更 */
  changeLocale: (newLocale: SupportedLocale) => void

  /** 利用可能なロケール一覧 */
  availableLocales: SupportedLocale[]
}

/**
 * LocalStorageキー
 */
const LOCALE_STORAGE_KEY = 'user-locale'

/**
 * デフォルト状態
 */
const initialState: MessageHookState = {
  locale: DEFAULT_LOCALE,
  isLoading: false,
}

/**
 * ロケール初期化：LocalStorage → ブラウザ → デフォルト
 */
function initializeLocale(): SupportedLocale {
  // SSR対応：サーバーサイドではデフォルトを返す
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  try {
    // 1. LocalStorageから取得試行
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    const validLocales: SupportedLocale[] = ['ja', 'en', 'pseudo']
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    if (stored && validLocales.includes(stored as SupportedLocale)) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      return stored as SupportedLocale
    }

    // 2. ブラウザ言語設定から検出
    return detectBrowserLocale()
  } catch (error) {
    console.warn('Failed to initialize locale:', error)
    return DEFAULT_LOCALE
  }
}

/**
 * ロケール永続化
 */
function persistLocale(locale: SupportedLocale): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch (error) {
    console.warn('Failed to persist locale:', error)
  }
}

/**
 * メッセージ翻訳Hook
 */
export function useMessages(): MessageHookReturn {
  const [state, setState] = useState<MessageHookState>(initialState)

  // 初期化エフェクト
  useEffect(() => {
    const locale = initializeLocale()
    setState(prevState => ({
      ...prevState,
      locale,
    }))
  }, [])

  /**
   * 基本翻訳関数
   */
  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>): string => {
      const message = getMessageSafe(key, state.locale, params)
      return message
    },
    [state.locale]
  )

  /**
   * エラーメッセージ翻訳（APIレスポンス用）
   */
  const tError = useCallback(
    (code: MessageKey, fallback?: string): string => {
      // error.* または auth.*（認証エラー）のみ許可
      if (!code.startsWith('error.') && !code.startsWith('auth.')) {
        console.warn(`Non-error message key used in error context: ${code}`)
        return fallback || code
      }

      const message = getMessageSafe(code, state.locale)
      return message === code ? fallback || code : message
    },
    [state.locale]
  )

  /**
   * 成功メッセージ翻訳
   */
  const tSuccess = useCallback(
    (code: MessageKey, fallback?: string): string => {
      if (!code.startsWith('success.')) {
        console.warn(`Non-success message key used in success context: ${code}`)
        return fallback || code
      }

      const message = getMessageSafe(code, state.locale)
      return message === code ? fallback || code : message
    },
    [state.locale]
  )

  /**
   * UIラベル翻訳
   */
  const tUI = useCallback(
    (code: MessageKey, fallback?: string): string => {
      if (!code.startsWith('ui.') && !code.startsWith('action.')) {
        console.warn(`Non-UI message key used in UI context: ${code}`)
        return fallback || code
      }

      const message = getMessageSafe(code, state.locale)
      return message === code ? fallback || code : message
    },
    [state.locale]
  )

  /**
   * バリデーションエラー翻訳（パラメータ補間対応）
   */
  const tValidation = useCallback(
    (code: MessageKey, params?: Record<string, string | number>): string => {
      if (!code.startsWith('validation.')) {
        console.warn(
          `Non-validation message key used in validation context: ${code}`
        )
        return code
      }

      const message = getMessageSafe(code, state.locale, params)
      return message
    },
    [state.locale]
  )

  /**
   * ロケール変更
   */
  const changeLocale = useCallback((newLocale: SupportedLocale): void => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
    }))

    // 非同期でロケール変更（UIの応答性確保）
    setTimeout(() => {
      persistLocale(newLocale)
      setState(prevState => ({
        ...prevState,
        locale: newLocale,
        isLoading: false,
      }))
    }, 0)
  }, [])

  /**
   * アクション・ボタンラベル翻訳
   */
  const tAction = useCallback(
    (code: MessageKey, fallback?: string): string => {
      if (!code.startsWith('action.')) {
        console.warn(`Non-action message key used in action context: ${code}`)
        return fallback || code
      }

      const message = getMessageSafe(code, state.locale)
      return message === code ? fallback || code : message
    },
    [state.locale]
  )

  return {
    locale: state.locale,
    isLoading: state.isLoading,
    t,
    tError,
    tSuccess,
    tUI,
    tAction,
    tValidation,
    changeLocale,
    availableLocales: ['ja', 'en', 'pseudo'] as const,
  }
}

/**
 * 言語表示名取得ヘルパー
 */
export function getLocaleDisplayName(locale: SupportedLocale): string {
  const displayNames: Record<SupportedLocale, string> = {
    ja: '日本語',
    en: 'English',
    pseudo: '[!! Pseudo !!]',
  }
  return displayNames[locale]
}

/**
 * APIエラーレスポンスの翻訳ヘルパー
 */
export function useApiErrorTranslation() {
  const { tError } = useMessages()

  return useCallback(
    (errorResponse: { code?: string; message?: string }): string => {
      // codeがあればMessageKeyとして翻訳試行
      if (errorResponse.code) {
        // eslint-disable-next-line @template/message-keys/require-message-key, @typescript-eslint/consistent-type-assertions
        return tError(errorResponse.code as MessageKey, errorResponse.message)
      }

      // フォールバック：messageまたはデフォルト
      return errorResponse.message || 'Unknown error occurred'
    },
    [tError]
  )
}
