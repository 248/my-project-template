'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

import { useMessages } from '@/hooks/useMessages'

import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * ユーザープロフィール表示コンポーネント
 *
 * 実装ガイドライン準拠:
 * - 型ガードによる安全な型変換
 * - 適切なローディング状態管理
 * - エラー境界の実装
 */
export function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { tUI, tError } = useMessages()

  // ローディング状態
  if (!isLoaded) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  // 未認証状態
  if (!isSignedIn || !user) {
    return <div className="text-red-600">{tError('error.user_not_found')}</div>
  }

  return (
    <div className="space-y-4">
      {/* Language Switcher for testing */}
      <LanguageSwitcher />

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {tUI('ui.profile_info')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.user_id')}
            </label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.display_name')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.firstName} {user.lastName}
              {user.fullName ? ` (${user.fullName})` : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.email_address')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.primaryEmailAddress?.emailAddress || tUI('ui.not_set')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.created_at')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString('ja-JP')
                : tUI('ui.unknown')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.updated_at')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.updatedAt
                ? new Date(user.updatedAt).toLocaleString('ja-JP')
                : tUI('ui.unknown')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {tUI('ui.auth_providers')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.externalAccounts
                ?.map(account => account.provider)
                .join(', ') || 'Email'}
            </p>
          </div>
        </div>
      </div>

      {/* アバター */}
      {user.imageUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tUI('ui.avatar')}
          </label>
          <Image
            src={user.imageUrl}
            alt="User avatar"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full border-2 border-gray-300"
          />
        </div>
      )}
    </div>
  )
}
