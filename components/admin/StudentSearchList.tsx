'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  full_name: string
  email: string | null
  sectionName: string | null
  isActive: boolean
}

const STATUS_FILTERS = ['all', 'active', 'deactivated'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

export default function StudentSearchList({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (status === 'active' && !s.isActive) return false
      if (status === 'deactivated' && s.isActive) return false
      if (!q) return true
      return s.full_name.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    })
  }, [students, query, status])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors border',
                status === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((student) => (
          <Link
            key={student.id}
            href={`/admin/students/${student.id}`}
            className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {student.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{student.full_name}</p>
                  {!student.isActive && (
                    <Badge variant="secondary" className="text-xs">Deactivated</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.email ?? '—'} · {student.sectionName ?? 'Unassigned'}
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">›</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No students found.</p>
        )}
      </div>
    </div>
  )
}
