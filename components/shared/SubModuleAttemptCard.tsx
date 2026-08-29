'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ResetAttemptButton from '@/components/teacher/ResetAttemptButton'
import AttemptReview from '@/components/shared/AttemptReview'
import type { SubModule } from '@/content/types'

interface AttemptRow {
  id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string | null
  started_at: string
  is_active: boolean
}

interface AnswerRow {
  attempt_id: string
  item_id: string
  activity_type: string
  answer_given: string | null
  is_correct: boolean
}

interface Props {
  submodule: SubModule
  learnedLabel: string
  attempts: AttemptRow[]
  answers: AnswerRow[]
  studentName: string
  sectionId?: string | null
  sectionName?: string | null
}

export default function SubModuleAttemptCard({
  submodule,
  learnedLabel,
  attempts,
  answers,
  studentName,
  sectionId,
  sectionName,
}: Props) {
  // attempts is already sorted oldest -> newest; start on the latest.
  const [index, setIndex] = useState(attempts.length - 1)
  const selected = attempts[index]
  const submitted = !!selected?.submitted_at
  const isActive = !!selected?.is_active
  const percent = selected?.total ? Math.round((selected.score ?? 0) / selected.total * 100) : null
  const itemAnswers = selected ? answers.filter((a) => a.attempt_id === selected.id) : []

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{submodule.title}</p>
          <p className="text-xs text-muted-foreground">Learn: {learnedLabel} items viewed</p>
        </div>

        {attempts.length > 0 && (
          <div className="flex items-center gap-2">
            {submitted && percent !== null && (
              <span className={`text-sm font-bold ${
                percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {selected.score}/{selected.total} ({percent}%)
              </span>
            )}
            {selected && !submitted && (
              <span className="text-xs text-amber-600 font-medium">In progress</span>
            )}
            {isActive && submitted && (
              <ResetAttemptButton
                attemptId={selected.id}
                studentName={studentName}
                submoduleTitle={submodule.title}
                sectionId={sectionId}
                sectionName={sectionName}
              />
            )}
          </div>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Previous attempt"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="font-medium">
            Attempt {index + 1} of {attempts.length}
            {!isActive && ' (past)'}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={index === attempts.length - 1}
            onClick={() => setIndex((i) => Math.min(attempts.length - 1, i + 1))}
            aria-label="Next attempt"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {submitted && itemAnswers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Item Analysis</p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {submodule.items.map((item) => {
              const results = itemAnswers.filter((a) => a.item_id === item.id)
              const correctCount = results.filter((a) => a.is_correct).length
              const ratio = results.length > 0 ? correctCount / results.length : null
              const status = ratio === null ? null : ratio === 1 ? 'correct' : ratio >= 0.5 ? 'partial' : 'wrong'
              return (
                <div
                  key={item.id}
                  title={`${item.label}: ${correctCount}/${results.length} correct`}
                  className={`flex items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-xs font-bold ${
                    status === 'correct' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    status === 'wrong' ? 'bg-red-100 text-red-700' :
                    'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.label}
                  {status === 'correct' && <CheckCircle2 className="h-3 w-3" />}
                  {status === 'partial' && <AlertTriangle className="h-3 w-3" />}
                  {status === 'wrong' && <span>✗</span>}
                </div>
              )
            })}
          </div>
          <AttemptReview answers={itemAnswers} items={submodule.items} />
        </div>
      )}
    </div>
  )
}
