'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentBasic {
  id: string
  full_name: string
  href: string
  is_active?: boolean
}

interface Attempt {
  student_id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string
}

export interface ModuleOption {
  id: string
  title: string
  icon: string
  subModuleIds: string[]
  source: 'admin' | 'teacher'
}

interface Props {
  students: StudentBasic[]
  attempts: Attempt[]
  enabledSubmoduleIds: string[]
  /** Custom + admin modules, combined — powers the filter pills below. */
  modules: ModuleOption[]
}

export default function SectionPerformanceList({ students, attempts, enabledSubmoduleIds, modules }: Props) {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [scope, setScope] = useState<string>('all')

  const adminModules = modules.filter((mod) => mod.source === 'admin')
  const teacherModules = modules.filter((mod) => mod.source === 'teacher')

  const submoduleToModule = useMemo(() => {
    const map = new Map<string, ModuleOption>()
    for (const mod of modules) {
      for (const smId of mod.subModuleIds) map.set(smId, mod)
    }
    return map
  }, [modules])

  function matchesScope(submoduleId: string) {
    if (scope === 'all') return true
    if (scope === 'admin-all') return submoduleToModule.get(submoduleId)?.source === 'admin'
    if (scope === 'teacher-all') return submoduleToModule.get(submoduleId)?.source === 'teacher'
    return submoduleToModule.get(submoduleId)?.id === scope
  }

  const totalForScope = enabledSubmoduleIds.filter(matchesScope).length

  const rows = useMemo(() => {
    return students.map((student) => {
      const studentAttempts = attempts
        .filter((a) => a.student_id === student.id && matchesScope(a.submodule_id))
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
    // no data yet always sinks to the bottom, regardless of sort direction
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
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
      >
        <option value="all">All Modules</option>
        {adminModules.length > 0 && (
          <optgroup label="Admin">
            <option value="admin-all">All Admin Modules</option>
            {adminModules.map((mod) => (
              <option key={mod.id} value={mod.id}>{mod.icon} {mod.title}</option>
            ))}
          </optgroup>
        )}
        {teacherModules.length > 0 && (
          <optgroup label="Teacher">
            <option value="teacher-all">All Teacher Modules</option>
            {teacherModules.map((mod) => (
              <option key={mod.id} value={mod.id}>{mod.icon} {mod.title}</option>
            ))}
          </optgroup>
        )}
      </select>

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

      <div className="max-h-80 space-y-2 overflow-y-auto">
        {ranked.map((student, idx) => (
          <Link
            key={student.id}
            href={student.href}
            className={cn(
              'flex items-center justify-between rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow',
              student.is_active === false && 'opacity-50 hover:opacity-75',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-secondary-soft)] text-sm font-bold text-[var(--brand-secondary)]">
                {student.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="flex items-center gap-1.5 font-medium">
                  {student.full_name}
                  {student.is_active === false && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Deactivated
                    </span>
                  )}
                </p>
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
