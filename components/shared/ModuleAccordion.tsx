'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleSection {
  id: string
  title: string
  icon: string
  content: ReactNode
}

export default function ModuleAccordion({ sections }: { sections: ModuleSection[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {sections.map((s) => {
        const open = openId === s.id
        return (
          <div key={s.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenId(open ? null : s.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-sm">
                <span className="text-lg">{s.icon}</span> {s.title}
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>
            {open && <div className="border-t px-4 py-3 space-y-2">{s.content}</div>}
          </div>
        )
      })}
    </div>
  )
}
