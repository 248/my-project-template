'use client'

import { ApiTestPanel } from '@/components/ApiTestPanel'
import { ProjectInfo } from '@/components/ProjectInfo'
import { QuickActions } from '@/components/QuickActions'
import { TechStack } from '@/components/TechStack'
import { UserProfile } from '@/components/UserProfile'
import { useMessages } from '@/hooks/useMessages'

/**
 * /home - 保護されたホームページ
 * 認証済みユーザーのみアクセス可能
 */
export default function HomePage() {
  const { tUI, locale } = useMessages()

  // Force component re-render when locale changes
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('HomePage locale:', locale)
  }
  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="sm:px-0">
        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {tUI('ui.dashboard')} [{locale}]
          </h1>
          <p className="text-gray-600">{tUI('ui.authenticated_user_page')}</p>
        </div>

        {/* プロジェクト情報セクション */}
        <div className="mb-6">
          <ProjectInfo />
        </div>

        {/* 2カラムグリッドレイアウト - レスポンシブ対応 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* 左カラム: ユーザープロフィール */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <UserProfile />
          </div>

          {/* 右カラム: API接続テスト */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <ApiTestPanel />
          </div>
        </div>

        {/* 技術スタックとクイックアクション - レスポンシブ対応 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 技術スタック */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <TechStack />
          </div>

          {/* クイックアクション */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
