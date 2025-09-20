'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

import { useMessages } from '@/hooks/useMessages'

// プレビュー環境でのCSP問題対応：静的最適化を防ぐ
export const dynamic = 'force-dynamic'

export default function SSOCallbackPage() {
  const { tUI } = useMessages()
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{tUI('ui.loading')}</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
