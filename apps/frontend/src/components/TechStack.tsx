'use client'
import { useMessages } from '@/hooks/useMessages'

interface TechStackItem {
  name: string
  version: string
  color: string
}

const techStackItems: TechStackItem[] = [
  {
    name: 'Next.js',
    version: '15',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    name: 'TypeScript',
    version: '5.x',
    color: 'bg-green-100 text-green-800',
  },
  {
    name: 'Tailwind CSS',
    version: '3.x',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    name: 'Hono',
    version: '4.x',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    name: 'Clerk',
    version: '5.x',
    color: 'bg-red-100 text-red-800',
  },
  {
    name: 'Prisma',
    version: '5.x',
    color: 'bg-indigo-100 text-indigo-800',
  },
]

export function TechStack() {
  const { tUI } = useMessages()
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {tUI('ui.tech_stack_title')}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {techStackItems.map(item => (
          <div
            key={item.name}
            className="flex items-center justify-between p-2 md:p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-gray-500">v{item.version}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {item.name === 'Next.js' && tUI('ui.tech_nextjs_desc')}
                {item.name === 'TypeScript' && tUI('ui.tech_typescript_desc')}
                {item.name === 'Tailwind CSS' && tUI('ui.tech_tailwind_desc')}
                {item.name === 'Hono' && tUI('ui.tech_hono_desc')}
                {item.name === 'Clerk' && tUI('ui.tech_clerk_desc')}
                {item.name === 'Prisma' && tUI('ui.tech_prisma_desc')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
