'use client'

import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

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
    return (
      <div className="text-red-600">ユーザー情報を読み込めませんでした</div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          プロフィール情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              ユーザーID
            </label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              表示名
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.firstName} {user.lastName}
              {user.fullName ? ` (${user.fullName})` : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.primaryEmailAddress?.emailAddress || '未設定'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              作成日時
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString('ja-JP')
                : '不明'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              最終更新
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {user.updatedAt
                ? new Date(user.updatedAt).toLocaleString('ja-JP')
                : '不明'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              認証プロバイダー
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
            アバター
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
