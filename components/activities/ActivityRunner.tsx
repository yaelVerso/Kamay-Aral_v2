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
 * Builds the activity/practice step sequence interleaved per item:
 *   Lesson Card A → Sign to Picture A → Spelling A
 *   Lesson Card B → Sign to Picture B → Spelling B → ...
 *
 * Drag & Drop Match is deliberately excluded here — matching-type
 * questions only appear in Quiz mode, never in practice.
 */
function buildActivitySteps(submodule: SubModule): ActivityStep[] {
  const items = submodule.items
  const perItemTypes = submodule.activitySequence.filter((t) => t !== 'drag-drop-match')

  const steps: ActivityStep[] = []

  for (const item of items) {
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
  }

  return steps
}

const QUIZ_SIGN_TO_PICTURE_COUNT = 4
const QUIZ_SPELLING_COUNT = 4
const QUIZ_DRAG_DROP_GROUP_COUNT = 2

/**
 * Picks `count` items from `pool`, guaranteeing every item appears at
 * least once before any repeats when `count >= pool.length` (draws full
 * shuffled cycles back-to-back). This is what makes a small submodule's
 * items all show up across a quiz instead of random chance leaving some
 * out — two independent 4-item draws from a 7-item pool would only cover
 * ~6 of the 7 on average.
 */
function pickItemsCoveringAll(pool: SignItem[], count: number): SignItem[] {
  if (pool.length === 0) return []
  const result: SignItem[] = []
  while (result.length < count) {
    const shuffled = shuffle(pool)
    result.push(...shuffled.slice(0, count - result.length))
  }
  return result
}

/**
 * Builds a fixed-length 10-question quiz, grouped by type — 4 Sign to
 * Picture, then 4 Spelling, then 2 Drag & Drop Match groups — each section
 * independently shuffled. Grouping by type (instead of interleaving per
 * item) prevents a question in one type from giving away the answer to
 * the very next question about the same item.
 *
 * Sign to Picture and Spelling share one coverage-guaranteeing draw (8
 * items total) rather than two independent 4-item draws, so a submodule
 * with 8 or fewer items has every one of them appear somewhere in the
 * quiz instead of a random subset.
 */
function buildQuizSteps(submodule: SubModule): ActivityStep[] {
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match')
  const steps: ActivityStep[] = []

  const identificationPool = pickItemsCoveringAll(
    submodule.items,
    QUIZ_SIGN_TO_PICTURE_COUNT + QUIZ_SPELLING_COUNT,
  )
  const signToPictureItems = identificationPool.slice(0, QUIZ_SIGN_TO_PICTURE_COUNT)
  const spellingItems = identificationPool.slice(QUIZ_SIGN_TO_PICTURE_COUNT)

  for (const item of signToPictureItems) {
    const distractors = shuffle(submodule.items.filter((it) => it.id !== item.id))
    steps.push({ type: 'sign-to-picture', item, distractors })
  }

  for (const item of spellingItems) {
    steps.push({ type: 'spelling', item })
  }

  if (hasDragDrop && submodule.items.length >= 3) {
    const dragDropPool = pickItemsCoveringAll(submodule.items, QUIZ_DRAG_DROP_GROUP_COUNT * 3)
    for (let g = 0; g < QUIZ_DRAG_DROP_GROUP_COUNT; g++) {
      const group = dragDropPool.slice(g * 3, g * 3 + 3)
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
