'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import EditAdminModuleDialog from '@/components/admin/EditAdminModuleDialog'

interface ModuleRow {
  id: string
  title: string
  description: string | null
  icon: string
  color: string
  isActive: boolean
  submoduleCount: number
}

interface Props {
  modules: ModuleRow[]
  createButton: React.ReactNode
}

export default function AdminModulesList({ modules, createButton }: Props) {
  const [showArchived, setShowArchived] = useState(false)

  const archivedCount = modules.filter((m) => !m.isActive).length
  const visibleModules = showArchived ? modules : modules.filter((m) => m.isActive)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {createButton}
        {archivedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted hover:text-foreground"
            onClick={() => setShowArchived((s) => !s)}
          >
            {showArchived ? 'Hide archived modules' : `Show archived modules (${archivedCount})`}
          </Button>
        )}
      </div>

      {visibleModules.map((mod) => (
        <Link
          key={mod.id}
          href={`/admin/modules/${mod.id}`}
          className={`flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow ${mod.isActive ? '' : 'opacity-60'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
              {mod.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{mod.title}</p>
                {!mod.isActive && <Badge variant="secondary">Archived</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {mod.submoduleCount} sub-module{mod.submoduleCount === 1 ? '' : 's'} · {mod.isActive ? 'visible to everyone' : 'hidden — archived'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <EditAdminModuleDialog
              moduleId={mod.id}
              initialTitle={mod.title}
              initialDescription={mod.description}
              initialIcon={mod.icon}
              initialColor={mod.color}
            />
            <span className="text-muted-foreground ml-1">›</span>
          </div>
        </Link>
      ))}

      {visibleModules.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <BookOpen className="h-8 w-8" />
          <p>{modules.length === 0 ? 'No modules yet. Create one above.' : 'No archived modules.'}</p>
        </div>
      )}
    </div>
  )
}
