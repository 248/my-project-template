'use client'

import { usePathname } from 'next/navigation'

import { useMessages } from '@/hooks/useMessages'

/**
 * 条件付きヘッダーコンポーネント
 * /home以外のページでのみヘッダーを表示
 */
export function ConditionalHeader() {
  const pathname = usePathname()
  const { tUI } = useMessages()

  // /homeで始まるパスの場合はヘッダーを表示しない
  if (pathname.startsWith('/home')) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {tUI('ui.app_title')}
            </h1>
          </div>
        </div>
      </div>
    </nav>
  )
}
