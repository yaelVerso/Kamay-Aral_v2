'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODULES } from '@/content/registry'

interface StudentBasic {
  id: string
  full_name: string
  href: string
}

interface Attempt {
  student_id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string
}

interface Props {
  students: StudentBasic[]
  attempts: Attempt[]
  enabledSubmoduleIds: string[]
}

const MODULE_OPTIONS = MODULES.filter((mod) => mod.subModules.length > 0)

export default function SectionPerformanceList({ students, attempts, enabledSubmoduleIds }: Props) {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [scope, setScope] = useState<string>('all')

  const submoduleToModule = useMemo(() => {
    const map = new Map<string, string>()
    for (const mod of MODULES) {
      for (const sm of mod.subModules) map.set(sm.id, mod.id)
    }
    return map
  }, [])

  const totalForScope = scope === 'all'
    ? enabledSubmoduleIds.length
    : enabledSubmoduleIds.filter((id) => submoduleToModule.get(id) === scope).length

  const rows = useMemo(() => {
    return students.map((student) => {
      const studentAttempts = attempts
        .filter((a) => a.student_id === student.id && (scope === 'all' || submoduleToModule.get(a.submodule_id) === scope))
        .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
      const percents = studentAttempts.map((a) => (a.total ? (a.score ?? 0) / a.total * 100 : 0))
      const avg = percents.length > 0 ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length) : null

      let trend: 'up' | 'down' | null = null
      if (percents.length >= 2) {
        const latest = percents[percents.length - 1]
        const priorAvg = percents.slice(0, -1).reduce((sum, p) => sum + p, 0) / (percents.length - 1)
        if (latest > priorAvg) trend = 'up'
        else if (latest < priorAvg) trend = 'down'
      }

      return { ...student, avg, trend, completedCount: studentAttempts.length }
    })
  }, [students, attempts, scope, submoduleToModule])

  const ranked = [...rows].sort((a, b) => {
    // Students with no quiz data yet always sink to the bottom regardless of sort direction —
    // they aren't "doing well" or "doing poorly", there's just nothing to rank yet.
    if (a.avg === null && b.avg === null) return 0
    if (a.avg === null) return 1
    if (b.avg === null) return -1
    return order === 'asc' ? a.avg - b.avg : b.avg - a.avg
  })

  const withScores = rows.filter((s): s is typeof s & { avg: number } => s.avg !== null)
  const sectionAvg = withScores.length > 0
    ? Math.round(withScores.reduce((sum, s) => sum + s.avg, 0) / withScores.length)
    : null
  const needsAttentionCount = withScores.filter((s) => s.avg < 50).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setScope('all')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
            scope === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-muted-foreground border-border hover:bg-muted',
          )}
        >
          All Modules
        </button>
        {MODULE_OPTIONS.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setScope(mod.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
              scope === mod.id
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-muted-foreground border-border hover:bg-muted',
            )}
          >
            {mod.icon} {mod.title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {sectionAvg !== null && (
            <span>Average: <strong className="text-foreground">{sectionAvg}%</strong></span>
          )}
          {needsAttentionCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" /> {needsAttentionCount} need attention
            </span>
          )}
        </div>
        <button
          onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          {order === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {order === 'asc' ? 'Lowest first' : 'Highest first'}
        </button>
      </div>

      <div className="space-y-2">
        {ranked.map((student, idx) => (
          <Link
            key={student.id}
            href={student.href}
            className="flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {student.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-xs text-muted-foreground">{student.completedCount}/{totalForScope} quizzes taken</p>
              </div>
            </div>
            {student.avg !== null ? (
              <span className="flex items-center gap-1">
                {student.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                {student.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                <span className={`text-sm font-bold ${student.avg >= 80 ? 'text-emerald-600' : student.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {student.avg}% avg
                </span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">No data yet</span>
            )}
          </Link>
        ))}
        {ranked.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No students yet.</p>
        )}
      </div>
    </div>
  )
}
