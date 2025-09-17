'use client'
import { useMessages } from '@/hooks/useMessages'
import { getApiBaseUrl } from '@/lib/utils/api-config'

interface QuickAction {
  title: string
  description: string
  icon: string
  href?: string
  onClick?: () => void
}

function buildActions(
  tUI: (k: any) => string,
  tAction: (k: any) => string
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
      icon: '📚',
      onClick: () => window.open(apiDocsUrl, '_blank', 'noopener,noreferrer'),
    },
    {
      title: tAction('action.open_github'),
      description: tUI('ui.open_github_desc'),
      icon: '🔗',
      onClick: () =>
        window.open('https://github.com', '_blank', 'noopener,noreferrer'),
    },
    {
      title: tAction('action.view_docs'),
      description: tUI('ui.view_docs_desc'),
      icon: '📋',
      onClick: () => alert(tUI('ui.view_docs_desc')),
    },
    {
      title: tAction('action.template_info'),
      description: tUI('ui.template_info_desc'),
      icon: '💡',
      onClick: () => alert(tUI('ui.template_info_modal')),
    },
  ]
}

export function QuickActions() {
  const { tUI, tAction } = useMessages()
  const quickActions = buildActions(tUI, tAction)
  const handleAction = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      window.location.href = action.href
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
    </div>
  )
}
