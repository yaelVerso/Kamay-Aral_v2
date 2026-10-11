'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Module, SubModule, SignItem, ActivityType } from '@/content/types'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, XCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import LessonCard from './LessonCard'
import SignToPicture from './SignToPicture'
import DragDropMatch from './DragDropMatch'
import Spelling from './Spelling'
import { createClient } from '@/lib/supabase/client'
import { recordAuditLog } from '@/app/actions/audit'
import { cn } from '@/lib/utils'
import { shuffle } from '@/lib/shuffle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ActivityStep {
  type: ActivityType
  /** Primary item for this step */
  item: SignItem
  /** For drag-drop: the 3 items in the group */
  groupItems?: SignItem[]
  /** For sign-to-picture: distractors */
  distractors?: SignItem[]
  /**
   * Which occurrence (0, 1, 2…) of this (type, item) pair this step is within
   * the quiz — small submodules cycle their item pool to fill the fixed quiz
   * shape, so the same item can legitimately appear twice as the same question
   * type in one attempt. Without this, two such rows would collide on
   * (attempt_id, item_id, activity_type) when submitted together. Quiz-only.
   */
  occurrence?: number
  /** For drag-drop: occurrence per item in groupItems, same index alignment. */
  groupOccurrences?: number[]
}

interface QuizAnswer {
  activity_type: string
  item_id: string
  answer_given: string | null
  is_correct: boolean
  /** Quiz-only — see ActivityStep.occurrence. Always 0 for practice mode. */
  occurrence?: number
}

interface Props {
  module: Module
  submodule: SubModule
  mode: 'activity' | 'quiz'
  attemptId?: string
  backHref: string
}

// interleaved per item: Lesson Card A → Sign to Picture A → Spelling A → Lesson Card B → ...
// item order is randomized per session (avoids always drilling early items
// first, which would bias practice-answer data) — but the shuffle itself
// happens client-side only, after mount (see the effect in the component
// below), not in here. This function takes the already-decided item order
// as a plain argument instead of calling shuffle() itself, so the very
// first render (server + initial client hydration pass) can safely use the
// same deterministic (unshuffled) order on both sides — computing a random
// order directly during render would differ between the server's pass and
// the client's hydration pass (Math.random() isn't reproducible across
// them), which is a hydration mismatch: React would detect server/client
// HTML disagreeing and force a full client-side re-render to recover.
// drag-drop-match is quiz-only, skipped here.
function buildActivitySteps(submodule: SubModule, items: SignItem[]): ActivityStep[] {
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

const QUIZ_SIGN_TO_PICTURE_COUNT = 5
const QUIZ_SPELLING_COUNT = 4
const QUIZ_DRAG_DROP_GROUP_COUNT = 2

/** Number of scorable questions `buildQuizSteps` will produce for this submodule. */
export function getQuizQuestionCount(submodule: SubModule): number {
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match') && submodule.items.length >= 3
  return QUIZ_SIGN_TO_PICTURE_COUNT + QUIZ_SPELLING_COUNT + (hasDragDrop ? QUIZ_DRAG_DROP_GROUP_COUNT : 0)
}

/** Point value of a step — a Drag & Drop group is worth one point per pair (3), everything else is worth 1. */
function stepPoints(step: ActivityStep): number {
  if (step.type === 'lesson-card') return 0
  if (step.type === 'drag-drop-match') return step.groupItems?.length ?? 3
  return 1
}

// cycles through pool in order instead of random draw, so every student gets the same
// items for a submodule — keeps teacher's Sign Breakdown comparable section-wide.
// startIndex lets callers continue from where an earlier pool left off instead of
// every pool re-covering the same leading items, so submodules bigger than a single
// pool still get full coverage across the whole quiz.
function pickItemsCoveringAll(pool: SignItem[], count: number, startIndex = 0): SignItem[] {
  if (pool.length === 0) return []
  return Array.from({ length: count }, (_, i) => pool[(startIndex + i) % pool.length])
}

// fixed quiz shape: 5 sign-to-picture, 4 spelling, 2 drag-drop-match groups
// only presentation (question order, distractors, layout) is randomized per attempt —
// occurrence numbers are assigned here, before that shuffle, from the deterministic
// pool composition, distinguishing legitimate repeat items (see ActivityStep.occurrence)
function buildQuizSteps(submodule: SubModule): ActivityStep[] {
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match')
  const steps: ActivityStep[] = []
  const occurrenceCounters = new Map<string, number>()
  function nextOccurrence(type: string, itemId: string): number {
    const key = `${type}::${itemId}`
    const n = occurrenceCounters.get(key) ?? 0
    occurrenceCounters.set(key, n + 1)
    return n
  }

  const identificationPool = pickItemsCoveringAll(
    submodule.items,
    QUIZ_SIGN_TO_PICTURE_COUNT + QUIZ_SPELLING_COUNT,
  )
  const signToPictureTuples = identificationPool
    .slice(0, QUIZ_SIGN_TO_PICTURE_COUNT)
    .map((item) => ({ item, occurrence: nextOccurrence('sign-to-picture', item.id) }))
  const spellingTuples = identificationPool
    .slice(QUIZ_SIGN_TO_PICTURE_COUNT)
    .map((item) => ({ item, occurrence: nextOccurrence('spelling', item.id) }))

  for (const { item, occurrence } of shuffle(signToPictureTuples)) {
    const distractors = shuffle(submodule.items.filter((it) => it.id !== item.id))
    steps.push({ type: 'sign-to-picture', item, distractors, occurrence })
  }

  for (const { item, occurrence } of shuffle(spellingTuples)) {
    steps.push({ type: 'spelling', item, occurrence })
  }

  if (hasDragDrop && submodule.items.length >= 3) {
    const dragDropPool = pickItemsCoveringAll(
      submodule.items,
      QUIZ_DRAG_DROP_GROUP_COUNT * 3,
      QUIZ_SIGN_TO_PICTURE_COUNT + QUIZ_SPELLING_COUNT,
    )
    for (let g = 0; g < QUIZ_DRAG_DROP_GROUP_COUNT; g++) {
      const group = dragDropPool.slice(g * 3, g * 3 + 3)
      const groupOccurrences = group.map((it) => nextOccurrence('drag-drop-match', it.id))
      steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group, groupOccurrences })
    }
  }

  return steps
}

// Unshuffled — safe to compute identically on the server and on the client's
// initial hydration render. buildQuizSteps is unaffected by the hydration
// concern above (quiz only ever mounts after a client-side button press in
// QuizGate, never during an SSR pass), so it's untouched here.
function buildSteps(submodule: SubModule, mode: 'activity' | 'quiz'): ActivityStep[] {
  return mode === 'quiz' ? buildQuizSteps(submodule) : buildActivitySteps(submodule, submodule.items)
}

export default function ActivityRunner({ submodule, mode, attemptId, backHref }: Props) {
  const router = useRouter()
  const exitHref = backHref
  const [steps, setSteps] = useState(() => buildSteps(submodule, mode))
  // Practice's item order is randomized once per session, but only here,
  // client-side, after mount — see buildActivitySteps for why. Runs before
  // the user could possibly have answered anything yet, so swapping the
  // step order out from under stepAnswers/stepIndex (both still at their
  // just-mounted empty/zero state) is safe.
  useEffect(() => {
    if (mode === 'activity') {
      setSteps(buildActivitySteps(submodule, shuffle(submodule.items)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submodule, mode])
  // index-aligned with steps — drag-drop holds 3 entries, everything else 1, null = unanswered
  const [stepAnswers, setStepAnswers] = useState<(QuizAnswer[] | null)[]>(() => steps.map(() => null))
  const [stepIndex, setStepIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const itemById = useMemo(() => new Map(submodule.items.map((it) => [it.id, it])), [submodule.items])

  const current = steps[stepIndex]
  const progress = (stepIndex / steps.length) * 100

  const answers = useMemo(() => stepAnswers.flatMap((a) => a ?? []), [stepAnswers])
  const score = useMemo(() => answers.filter((a) => a.is_correct).length, [answers])
  const totalPoints = useMemo(() => steps.reduce((sum, s) => sum + stepPoints(s), 0), [steps])
  const currentAnswer = stepAnswers[stepIndex] ?? null
  const currentAnswered = current?.type === 'lesson-card' || currentAnswer !== null

  function recordAnswer(results: QuizAnswer[]) {
    setStepAnswers((prev) => {
      const next = [...prev]
      next[stepIndex] = results
      return next
    })
  }

  function goPrevious() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  async function goNext() {
    if (!currentAnswered) return
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
      return
    }
    if (mode === 'quiz') {
      setSubmitting(true)
      await submitQuiz()
      setSubmitting(false)
    } else if (answers.length > 0) {
      setSubmitting(true)
      await submitPractice()
      setSubmitting(false)
    }
    setFinished(true)
  }

  // A quiz is one unbroken attempt — nothing is saved until it's finished
  // in full, and exiting early (see the exit-confirm dialog below) loses
  // everything answered so far. Deliberate, not a missing feature: letting
  // an exited quiz resume with prior answers intact would let a student
  // leave mid-quiz, look an answer up in Learn/Practice, and come back to
  // fix just that one question before submitting.
  async function submitQuiz() {
    if (!attemptId) return
    const supabase = createClient()

    await supabase.from('quiz_answers').insert(
      answers.map((a) => ({ ...a, attempt_id: attemptId, occurrence: a.occurrence ?? 0 }))
    )
    await supabase.from('quiz_attempts').update({
      submitted_at: new Date().toISOString(),
      score,
      total: totalPoints,
    }).eq('id', attemptId)

    await recordAuditLog({
      action: 'quiz.submit',
      description: `submitted quiz for ${submodule.title} — ${score}/${totalPoints}`,
    })
  }

  async function submitPractice() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('practice_answers').insert(
      answers.map(({ occurrence: _occurrence, ...a }) => ({ ...a, student_id: user.id, submodule_id: submodule.id }))
    )
  }

  if (finished) {
    const percent = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 100

    function answerLabel(a: QuizAnswer) {
      if (a.activity_type === 'sign-to-picture' || a.activity_type === 'drag-drop-match') {
        return itemById.get(a.answer_given ?? '')?.label ?? a.answer_given
      }
      return a.answer_given
    }

    return (
      <div className="flex min-h-screen flex-col items-center px-6 py-10 gap-6 text-center">
        <div className="text-6xl">{percent >= 80 ? '🎉' : percent >= 50 ? '🙂' : '💪'}</div>
        <div>
          <h2 className="text-2xl font-bold">{mode === 'quiz' ? 'Quiz complete!' : 'Activity complete!'}</h2>
          {totalPoints > 0 && (
            <p className="text-muted-foreground mt-1">
              You got <strong>{score}/{totalPoints}</strong> ({percent}%) correct
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
                    <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
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
                              You answered: <strong>{answerLabel(a) || '—'}</strong>
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
          onClick={() => router.push(exitHref)}
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
          onClick={() => setShowExitConfirm(true)}
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

      {/* no internal scroll — Previous/Next sits right below, like Learn Mode */}
      <div className="px-4">
        {current.type === 'lesson-card' && (
          <LessonCard key={stepIndex} item={current.item} />
        )}
        {current.type === 'sign-to-picture' && (
          <SignToPicture
            key={stepIndex}
            item={current.item}
            distractors={current.distractors ?? []}
            mode={mode}
            initialAnswer={currentAnswer?.[0]?.answer_given ?? null}
            onAnswer={(correct, answerGiven) => recordAnswer([
              { activity_type: 'sign-to-picture', item_id: current.item.id, answer_given: answerGiven, is_correct: correct },
            ])}
          />
        )}
        {current.type === 'drag-drop-match' && (
          <DragDropMatch
            key={stepIndex}
            items={current.groupItems ?? [current.item]}
            mode={mode}
            initialMatches={currentAnswer ? Object.fromEntries(currentAnswer.map((a) => [a.item_id, a.answer_given ?? ''])) : null}
            onAnswer={(results) => recordAnswer(results.map((r) => ({
              activity_type: 'drag-drop-match',
              item_id: r.itemId,
              answer_given: r.matchedLabel,
              is_correct: r.correct,
            })))}
          />
        )}
        {current.type === 'spelling' && (
          <Spelling
            key={stepIndex}
            item={current.item}
            mode={mode}
            initialAnswer={currentAnswer?.[0]?.answer_given ?? null}
            onAnswer={(correct, answerGiven) => recordAnswer([
              { activity_type: 'spelling', item_id: current.item.id, answer_given: answerGiven, is_correct: correct },
            ])}
          />
        )}
      </div>

      {/* Previous / Next — width-matched to the content above */}
      <div className="flex gap-3 px-4 pt-4 pb-4 lg:w-3/4 lg:mx-auto">
        <button
          onClick={goPrevious}
          disabled={stepIndex === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-card border border-[#DAD2C5] shadow-[0_4px_0_#DAD2C5] py-3 text-lg font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
          Previous
        </button>
        <button
          onClick={goNext}
          disabled={!currentAnswered || submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] py-3 text-lg font-semibold text-white disabled:opacity-40 hover:bg-[#00A8BB] transition-colors"
        >
          {submitting ? 'Submitting…' : stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
          {!submitting && <ChevronRight className="h-6 w-6" />}
        </button>
      </div>

      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Careful!</DialogTitle>
            <DialogDescription>If you leave, you will lose your answers.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={() => router.push(exitHref)}
            >
              Leave
            </Button>
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setShowExitConfirm(false)}
            >
              Stay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
