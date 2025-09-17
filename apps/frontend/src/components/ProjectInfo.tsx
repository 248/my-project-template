'use client'
import { useMessages } from '@/hooks/useMessages'

export function ProjectInfo() {
  const { tUI } = useMessages()
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 md:p-6">
      <div className="flex items-start space-x-2 md:space-x-3">
        <div className="text-2xl md:text-3xl">🚀</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {tUI('ui.project_template_title')}
          </h2>
          <p className="text-sm text-gray-700 mb-3">
            {tUI('ui.project_template_description')}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {tUI('ui.badge_fullstack')}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {tUI('ui.badge_typescript')}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {tUI('ui.badge_authentication_included')}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {tUI('ui.badge_production_ready')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
