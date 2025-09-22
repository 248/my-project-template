'use client'
import { getMessageSafe, type MessageKey } from '@template/shared'
import { useState } from 'react'

import { useMessages } from '@/hooks/useMessages'
import { getApiBaseUrl } from '@/lib/utils/api-config'

interface QuickAction {
  title: string
  description: string
  icon: string
  href?: string
  onClick?: () => void
  modalMessageKey?: MessageKey
  ctaLabelKey?: MessageKey
}

function buildActions(
  tUI: (key: MessageKey, fallback?: string) => string,
  tAction: (key: MessageKey, fallback?: string) => string
): QuickAction[] {
  // APIドキュメント用リンクもENV起点に（プレビュー/本番対応）
  let apiOrigin = ''
  try {
    const base = getApiBaseUrl()
    apiOrigin = new URL(base).origin
  } catch {
    apiOrigin = ''
  }
  const apiDocsUrl = apiOrigin ? `${apiOrigin}/api/docs` : '/api/docs'

  return [
    {
      title: tAction('action.open_api_docs'),
      description: tUI('ui.open_api_docs_desc'),
      icon: '\u{1F4DA}',
      onClick: () => window.open(apiDocsUrl, '_blank', 'noopener,noreferrer'),
    },
    {
      title: tAction('action.open_github'),
      description: tUI('ui.open_github_desc'),
      icon: '\u{1F517}',
      onClick: () =>
        window.open(
          'https://github.com/248/my-project-template',
          '_blank',
          'noopener,noreferrer'
        ),
    },
    {
      title: tAction('action.view_docs'),
      description: tUI('ui.view_docs_desc'),
      icon: '\u{1F4CB}',
      modalMessageKey: 'ui.view_docs_desc',
      ctaLabelKey: 'action.view_docs',
      href: 'https://github.com/248/my-project-template/tree/main/docs',
    },
    {
      title: tAction('action.template_info'),
      description: tUI('ui.template_info_desc'),
      icon: '\u{1F4A1}',
      modalMessageKey: 'ui.template_info_modal',
      ctaLabelKey: 'action.template_info',
      href: 'https://github.com/248/my-project-template#readme',
    },
  ]
}

export function QuickActions() {
  const { tUI, tAction, locale } = useMessages()
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null)
  const quickActions = buildActions(tUI, tAction)
  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
      return
    }

    if (action.modalMessageKey) {
      setActiveAction(action)
      return
    }

    if (action.href) {
      window.open(action.href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {tUI('ui.quick_actions_title')}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {quickActions.map(action => (
          <button
            key={action.title}
            onClick={() => handleAction(action)}
            className="flex items-center p-2 md:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all text-left"
          >
            <div className="text-2xl mr-3">{action.icon}</div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {action.title}
              </h3>
              <p className="text-xs text-gray-600">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {activeAction?.modalMessageKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveAction(null)}
        >
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-gray-100 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200"
              onClick={() => setActiveAction(null)}
              aria-label={activeAction.title}
            >
              \u00D7
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {activeAction.title}
            </h3>
            <p className="whitespace-pre-line text-sm text-gray-700 mb-6">
              {getMessageSafe(activeAction.modalMessageKey, locale)}
            </p>
            <div className="flex justify-end gap-2">
              {activeAction.href && activeAction.ctaLabelKey && (
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      activeAction.href,
                      '_blank',
                      'noopener,noreferrer'
                    )
                    setActiveAction(null)
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {getMessageSafe(activeAction.ctaLabelKey, locale)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
