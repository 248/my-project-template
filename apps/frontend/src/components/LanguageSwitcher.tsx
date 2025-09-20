'use client'

import type { SupportedLocale } from '@template/shared'

import { useMessages, getLocaleDisplayName } from '../hooks/useMessages'

/**
 * 言語切り替えコンポーネント
 *
 * Phase 6 Step 1: 英語対応完成テスト用
 */
export function LanguageSwitcher() {
  const { locale, changeLocale, t, tUI, tError } = useMessages()

  const localeOptions: ReadonlyArray<{
    value: SupportedLocale
    label: string
  }> = (['ja', 'en', 'pseudo'] as const).map(v => ({
    value: v as SupportedLocale,
    label: getLocaleDisplayName(v as SupportedLocale),
  }))

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value
    const validLocale = localeOptions.find(option => option.value === newLocale)
    if (validLocale) {
      changeLocale(validLocale.value)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      {/* 言語選択 */}
      <div className="mb-4">
        <label
          htmlFor="locale-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {tUI('ui.language_label')}
        </label>
        <select
          id="locale-select"
          value={locale}
          onChange={handleLocaleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {localeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 翻訳テスト表示 */}
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded">
          <h3 className="font-semibold text-gray-900 mb-2">
            {tUI('ui.ui_labels_test_title')}
          </h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>
              <strong>{tUI('ui.user_id')}:</strong> {tUI('ui.user_id')}
            </li>
            <li>
              <strong>{tUI('ui.display_name')}:</strong>{' '}
              {tUI('ui.display_name')}
            </li>
            <li>
              <strong>{tUI('ui.email_address')}:</strong>{' '}
              {tUI('ui.email_address')}
            </li>
            <li>
              <strong>{tUI('ui.loading')}:</strong> {tUI('ui.loading')}
            </li>
            <li>
              <strong>{tUI('ui.unknown')}:</strong> {tUI('ui.unknown')}
            </li>
          </ul>
        </div>

        <div className="p-3 bg-red-50 rounded">
          <h3 className="font-semibold text-red-900 mb-2">
            {tUI('ui.error_messages_test_title')}
          </h3>
          <ul className="space-y-1 text-sm text-red-700">
            <li>
              <strong>{tUI('ui.sign_in_prompt')}:</strong>{' '}
              {tError('auth.signin_required')}
            </li>
            <li>
              <strong>{tUI('ui.user_id')}:</strong>{' '}
              {tError('error.user_not_found')}
            </li>
            <li>
              <strong>{tUI('ui.profile_info')}:</strong>{' '}
              {tError('error.profile_retrieval_failed')}
            </li>
          </ul>
        </div>

        <div className="p-3 bg-blue-50 rounded">
          <h3 className="font-semibold text-blue-900 mb-2">
            {tUI('ui.action_messages_test_title')}
          </h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>
              <strong>{tUI('ui.apitest_panel_title')}:</strong>{' '}
              {tUI('action.auth_api_test')}
            </li>
            <li>
              <strong>{tUI('action.error_details')}:</strong>{' '}
              {t('action.error_occurred')}
            </li>
            <li>
              <strong>{tUI('ui.system_health_check_title')}:</strong>{' '}
              {tUI('action.health_check_success')}
            </li>
          </ul>
        </div>

        {/* 現在のロケール表示 */}
        <div className="mt-4 p-3 bg-green-50 rounded">
          <p className="text-sm text-green-800">
            <strong>{tUI('ui.current_locale')}:</strong> {locale}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {tUI('ui.locale_storage_note')}
          </p>
        </div>
      </div>
    </div>
  )
}
