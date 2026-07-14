'use client'

import { useState, useMemo } from 'react'
import type { Module, SubModule, SignItem, ActivityType } from '@/content/types'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'
import LessonCard from './LessonCard'
import SignToPicture from './SignToPicture'
import DragDropMatch from './DragDropMatch'
import Spelling from './Spelling'
import { createClient } from '@/lib/supabase/client'
import { recordAuditLog } from '@/app/actions/audit'
import { cn } from '@/lib/utils'
import { shuffle } from '@/lib/shuffle'

interface ActivityStep {
  type: ActivityType
  /** Primary item for this step */
  item: SignItem
  /** For drag-drop: the 3 items in the group */
  groupItems?: SignItem[]
  /** For sign-to-picture: distractors */
  distractors?: SignItem[]
}

interface QuizAnswer {
  activity_type: string
  item_id: string
  answer_given: string | null
  is_correct: boolean
}

interface Props {
  module: Module
  submodule: SubModule
  mode: 'activity' | 'quiz'
  attemptId?: string
}

/**
 * Groups items into drag-drop triplets from a shuffled order. Final group
 * is padded (with the first item) if exactly 2 remain, skipped if 1 remains
 * (not enough for a meaningful match).
 */
function buildDragDropGroups(items: SignItem[]): SignItem[][] {
  const ordered = shuffle(items)
  const groups: SignItem[][] = []
  let i = 0
  for (; i + 3 <= ordered.length; i += 3) {
    groups.push(ordered.slice(i, i + 3))
  }
  const remaining = ordered.length - i
  if (remaining === 2) {
    groups.push([...ordered.slice(i), ordered[0]])
  }
  return groups
}

/**
 * Builds the activity step sequence interleaved per item:
 *   Lesson Card A → Sign to Picture A → Spelling A
 *   Lesson Card B → Sign to Picture B → Spelling B
 *   Lesson Card C → Sign to Picture C → Spelling C
 *   Drag & Drop [A, B, C]   ← review every 3 items
 *   Lesson Card D → ...
 */
function buildActivitySteps(submodule: SubModule): ActivityStep[] {
  const items = submodule.items
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match')
  const perItemTypes = submodule.activitySequence.filter((t) => t !== 'drag-drop-match')

  const steps: ActivityStep[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    for (const type of perItemTypes) {
      if (type === 'lesson-card') {
        steps.push({ type, item })
      } else if (type === 'sign-to-picture') {
        const distractors = shuffle(items.filter((it) => it.id !== item.id))
        steps.push({ type, item, distractors })
      } else if (type === 'spelling') {
        steps.push({ type, item })
      }
    }

    if (hasDragDrop) {
      const posInGroup = (i + 1) % 3
      const isGroupComplete = posInGroup === 0
      const isLastItem = i === items.length - 1

      if (isGroupComplete) {
        const group = items.slice(i - 2, i + 1)
        steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group })
      } else if (isLastItem && posInGroup >= 2) {
        const group = items.slice(i - (posInGroup - 1), i + 1)
        while (group.length < 3) group.push(items[0])
        steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group.slice(0, 3) })
      }
    }
  }

  return steps
}

/**
 * Builds the quiz step sequence grouped by activity type — all Sign to
 * Picture questions, then all Spelling questions, then all Drag & Drop
 * matches — each section independently shuffled. Grouping by type (instead
 * of interleaving per item) prevents a question in one type from giving
 * away the answer to the very next question about the same item.
 */
function buildQuizSteps(submodule: SubModule): ActivityStep[] {
  const perItemTypes = submodule.activitySequence.filter((t) => t !== 'drag-drop-match' && t !== 'lesson-card')
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match')

  const steps: ActivityStep[] = []

  for (const type of perItemTypes) {
    const ordered = shuffle(submodule.items)
    for (const item of ordered) {
      if (type === 'sign-to-picture') {
        const distractors = shuffle(submodule.items.filter((it) => it.id !== item.id))
        steps.push({ type, item, distractors })
      } else if (type === 'spelling') {
        steps.push({ type, item })
      }
    }
  }

  if (hasDragDrop) {
    for (const group of buildDragDropGroups(submodule.items)) {
      steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group })
    }
  }

  return steps
}

function buildSteps(submodule: SubModule, mode: 'activity' | 'quiz'): ActivityStep[] {
  return mode === 'quiz' ? buildQuizSteps(submodule) : buildActivitySteps(submodule)
}

export default function ActivityRunner({ module: mod, submodule, mode, attemptId }: Props) {
  const router = useRouter()
  const steps = useMemo(() => buildSteps(submodule, mode), [submodule, mode])
  const [stepIndex, setStepIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [finished, setFinished] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const itemById = useMemo(() => new Map(submodule.items.map((it) => [it.id, it])), [submodule.items])

  const current = steps[stepIndex]
  const progress = ((stepIndex) / steps.length) * 100

  async function handleNext(correct?: boolean, answerId?: string) {
    if (mode === 'quiz' && current.type !== 'lesson-card' && correct !== undefined) {
      const newAnswer: QuizAnswer = {
        activity_type: current.type,
        item_id: current.item.id,
        answer_given: answerId ?? null,
        is_correct: correct,
      }
      const updatedAnswers = [...answers, newAnswer]
      setAnswers(updatedAnswers)
      if (correct) setScore((s) => s + 1)

      if (stepIndex === steps.length - 1) {
        await submitQuiz(updatedAnswers, score + (correct ? 1 : 0))
        setFinished(true)
        return
      }
    } else if (mode === 'activity') {
      if (correct) setScore((s) => s + 1)
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      setFinished(true)
    }
  }

  async function submitQuiz(finalAnswers: QuizAnswer[], finalScore: number) {
    if (!attemptId) return
    const supabase = createClient()
    const scorableSteps = steps.filter((s) => s.type !== 'lesson-card')

    await supabase.from('quiz_answers').insert(
      finalAnswers.map((a) => ({ ...a, attempt_id: attemptId }))
    )
    await supabase.from('quiz_attempts').update({
      submitted_at: new Date().toISOString(),
      score: finalScore,
      total: scorableSteps.length,
    }).eq('id', attemptId)

    await recordAuditLog({
      action: 'quiz.submit',
      description: `submitted quiz for ${submodule.title} — ${finalScore}/${scorableSteps.length}`,
    })
  }

  if (finished) {
    const scorableCount = steps.filter((s) => s.type !== 'lesson-card').length
    const percent = scorableCount > 0 ? Math.round((score / scorableCount) * 100) : 100

    function answerLabel(a: QuizAnswer) {
      if (a.activity_type === 'sign-to-picture') {
        return itemById.get(a.answer_given ?? '')?.label ?? a.answer_given
      }
      return a.answer_given
    }

    return (
      <div className="flex min-h-screen flex-col items-center px-6 py-10 gap-6 text-center">
        <div className="text-6xl">{percent >= 80 ? '🎉' : percent >= 50 ? '🙂' : '💪'}</div>
        <div>
          <h2 className="text-2xl font-bold">{mode === 'quiz' ? 'Quiz complete!' : 'Activity complete!'}</h2>
          {scorableCount > 0 && (
            <p className="text-muted-foreground mt-1">
              You got <strong>{score}/{scorableCount}</strong> ({percent}%) correct
            </p>
          )}
        </div>

        {mode === 'quiz' && answers.length > 0 && (
          <div className="w-full max-w-md text-left">
            <button
              onClick={() => setShowReview((s) => !s)}
              className="flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-[#007B89]"
            >
              Review Answers
              <ChevronDown className={cn('h-4 w-4 transition-transform', showReview && 'rotate-180')} />
            </button>
            {showReview && (
              <div className="mt-3 space-y-2">
                {answers.map((a, idx) => {
                  const item = itemById.get(a.item_id)
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {a.is_correct ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#579F10]" />
                        ) : (
                          <XCircle className="h-5 w-5 shrink-0 text-[#C61518]" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{item?.label ?? a.item_id}</p>
                          {!a.is_correct && (
                            <p className="text-xs text-muted-foreground">
                              {a.activity_type === 'drag-drop-match'
                                ? answerLabel(a)
                                : <>You answered: <strong>{answerLabel(a) || '—'}</strong></>}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground capitalize">
                        {a.activity_type.replace(/-/g, ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => router.push(`/module/${mod.id}/${submodule.id}`)}
          className="w-full max-w-xs rounded-xl py-4 text-lg font-bold text-white bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB] transition-colors "
        >
          Back to {submodule.shortTitle}
        </button>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar + close */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={() => router.push(`/module/${mod.id}/${submodule.id}`)}
          className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
          aria-label="Exit"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-[#007B89] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground font-medium">
          {stepIndex + 1}/{steps.length}
        </span>
      </div>

      {/* Activity content */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {current.type === 'lesson-card' && (
          <LessonCard item={current.item} onNext={() => handleNext()} />
        )}
        {current.type === 'sign-to-picture' && (
          <SignToPicture
            item={current.item}
            distractors={current.distractors ?? []}
            mode={mode}
            onNext={(correct, answerGiven) => handleNext(correct, answerGiven)}
          />
        )}
        {current.type === 'drag-drop-match' && (
          <DragDropMatch
            items={current.groupItems ?? [current.item]}
            mode={mode}
            onNext={(correct, answerGiven) => handleNext(correct, answerGiven)}
          />
        )}
        {current.type === 'spelling' && (
          <Spelling
            item={current.item}
            mode={mode}
            onNext={(correct, answerGiven) => handleNext(correct, answerGiven)}
          />
        )}
      </div>
    </div>
  )
}
