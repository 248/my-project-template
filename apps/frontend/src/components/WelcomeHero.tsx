'use client'

import Link from 'next/link'

import { HealthCheckButton } from '@/components/HealthCheckButton'
import { useMessages } from '@/hooks/useMessages'

export function WelcomeHero() {
  const { tUI } = useMessages()
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        {tUI('ui.welcome_title')}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {tUI('ui.welcome_stack_line')}
      </p>
      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {tUI('ui.badge_nextjs')} 15
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            {tUI('ui.badge_typescript')}
          </div>
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            {tUI('ui.badge_tailwind')}
          </div>
          <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            {tUI('ui.badge_hono')}
          </div>
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {tUI('ui.badge_clerk')}
          </div>
        </div>
        <p className="text-sm text-gray-500">{tUI('ui.sign_in_prompt')}</p>
      </div>

      {/* サインインリンクセクション */}
      <div className="border-t pt-8 text-center">
        <div className="space-y-4">
          <Link
            href={{ pathname: '/sign-in' }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {tUI('action.sign_in')}
          </Link>
          <div className="text-sm text-gray-500">
            {tUI('ui.no_account_yet')}{' '}
            <Link
              href={{ pathname: '/sign-up' }}
              className="text-blue-600 hover:text-blue-500"
            >
              {tUI('action.sign_up')}
            </Link>
          </div>
        </div>
      </div>

      {/* ヘルスチェックボタンセクション */}
      <div className="border-t mt-8 pt-8">
        <HealthCheckButton />
      </div>
    </div>
  )
}
