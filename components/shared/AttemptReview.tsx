'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SignItem } from '@/content/types'

interface AnswerRow {
  item_id: string
  activity_type: string
  answer_given: string | null
  is_correct: boolean
}

export default function AttemptReview({ answers, items }: { answers: AnswerRow[]; items: SignItem[] }) {
  const [open, setOpen] = useState(false)
  const itemById = new Map(items.map((i) => [i.id, i]))

  function answerLabel(a: AnswerRow) {
    if (a.activity_type === 'sign-to-picture') {
      return itemById.get(a.answer_given ?? '')?.label ?? a.answer_given
    }
    return a.answer_given
  }

  if (answers.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold text-[#007B89]"
      >
        Review Answers
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {answers.map((a, idx) => {
            const item = itemById.get(a.item_id)
            return (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {a.is_correct ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{item?.label ?? a.item_id}</p>
                    {!a.is_correct && (
                      <p className="text-muted-foreground">
                        {a.activity_type === 'drag-drop-match'
                          ? answerLabel(a)
                          : <>Answered: <strong>{answerLabel(a) || '—'}</strong></>}
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 capitalize text-muted-foreground">{a.activity_type.replace(/-/g, ' ')}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
