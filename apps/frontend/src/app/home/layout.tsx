import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { AppTitle } from '@/components/AppTitle'
import { AuthBadge } from '@/components/AuthBadge'

/**
 * 保護されたレイアウト
 * /home以下のすべてのページは認証が必要
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  // 未認証の場合はルートページにリダイレクト
  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 認証済みユーザー用ナビゲーション */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                <AppTitle />
              </h1>
              <AuthBadge />
            </div>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main>{children}</main>
    </div>
  )
}
