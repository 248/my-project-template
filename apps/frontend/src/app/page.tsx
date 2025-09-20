import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import { WelcomeHero } from '@/components/WelcomeHero'

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
          <WelcomeHero />
        </div>
      </div>
    </div>
  )
}
