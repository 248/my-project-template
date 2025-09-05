import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HealthCheckButton } from '@/components/HealthCheckButton'

export default async function HomePage() {
  const { userId } = await auth()

  // ログイン済みユーザーは/homeにリダイレクト
  if (userId) {
    redirect('/home')
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              プロジェクトテンプレートへようこそ
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Next.js + Hono + TypeScript + Tailwind CSS + Clerk認証
            </p>
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Next.js 15
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  TypeScript
                </div>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Tailwind CSS
                </div>
                <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  Hono
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Clerk
                </div>
              </div>
              <p className="text-sm text-gray-500">
                サインインしてアプリケーションにアクセス
              </p>
            </div>
          </div>

          {/* サインインリンクセクション */}
          <div className="border-t pt-8 text-center">
            <div className="space-y-4">
              <Link
                href="/sign-in"
                as
                any
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                サインイン
              </Link>
              <div className="text-sm text-gray-500">
                まだアカウントをお持ちでない場合は{' '}
                <Link
                  href="/sign-up"
                  as
                  any
                  className="text-blue-600 hover:text-blue-500"
                >
                  サインアップ
                </Link>
              </div>
            </div>
          </div>

          {/* ヘルスチェックボタンセクション */}
          <div className="border-t mt-8 pt-8">
            <HealthCheckButton />
          </div>
        </div>
      </div>
    </div>
  )
}
