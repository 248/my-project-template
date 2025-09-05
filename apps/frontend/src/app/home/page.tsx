'use client'

import { UserProfile } from '@/components/UserProfile'
import { AuthHealthCheckButton } from '@/components/AuthHealthCheckButton'
import { useMessages } from '@/hooks/useMessages'

/**
 * /home - 保護されたホームページ
 * 認証済みユーザーのみアクセス可能
 */
export default function HomePage() {
  const { tUI, tAction, locale } = useMessages()

  // Force component re-render when locale changes
  console.log('HomePage locale:', locale)
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {tUI('ui.dashboard')} [{locale}]
            </h1>
            <p className="text-gray-600">{tUI('ui.authenticated_user_page')}</p>
          </div>

          {/* ユーザープロフィールセクション */}
          <div className="p-6">
            <UserProfile />
          </div>

          {/* API接続テストセクション */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {tAction('action.auth_api_test')}
            </h2>
            <AuthHealthCheckButton />
          </div>
        </div>
      </div>
    </div>
  )
}
