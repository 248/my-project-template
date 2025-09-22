'use client'

import { useMessages } from '@/hooks/useMessages'

export function AppTitle() {
  const { tUI } = useMessages()
  return <>{tUI('ui.app_title')}</>
}
