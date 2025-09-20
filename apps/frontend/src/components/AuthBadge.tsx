'use client'

import { useMessages } from '@/hooks/useMessages'

export function AuthBadge() {
  const { tUI } = useMessages()
  return (
    <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
      {tUI('ui.authenticated_badge')}
    </span>
  )
}
