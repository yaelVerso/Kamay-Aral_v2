'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react'

interface Row {
  id: string
  full_name: string
  avg: number | null
  href: string
}

export default function SectionPerformanceList({ students }: { students: Row[] }) {
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const ranked = [...students].sort((a, b) => {
    // Students with no quiz data yet always sink to the bottom regardless of sort direction —
    // they aren't "doing well" or "doing poorly", there's just nothing to rank yet.
    if (a.avg === null && b.avg === null) return 0
    if (a.avg === null) return 1
    if (b.avg === null) return -1
    return order === 'asc' ? a.avg - b.avg : b.avg - a.avg
  })

  const withScores = students.filter((s): s is Row & { avg: number } => s.avg !== null)
  const sectionAvg = withScores.length > 0
    ? Math.round(withScores.reduce((sum, s) => sum + s.avg, 0) / withScores.length)
    : null
  const needsAttentionCount = withScores.filter((s) => s.avg < 50).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {sectionAvg !== null && (
            <span>Section average: <strong className="text-foreground">{sectionAvg}%</strong></span>
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
            className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {idx + 1}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                {student.full_name[0]?.toUpperCase()}
              </div>
              <p className="font-medium">{student.full_name}</p>
            </div>
            {student.avg !== null ? (
              <span className={`text-sm font-bold ${student.avg >= 80 ? 'text-emerald-600' : student.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {student.avg}% avg
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
