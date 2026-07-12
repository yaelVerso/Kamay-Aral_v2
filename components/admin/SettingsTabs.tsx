'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

export default function SettingsTabs({ tabs }: { tabs: Tab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id)
  const active = tabs.find((t) => t.id === activeId)

  return (
    <div>
      <div className="flex gap-1 border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeId === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active?.content}
    </div>
  )
}
