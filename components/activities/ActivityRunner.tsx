'use client'

import { useState, useMemo } from 'react'
import type { Module, SubModule, SignItem, ActivityType } from '@/content/types'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import LessonCard from './LessonCard'
import SignToPicture from './SignToPicture'
import DragDropMatch from './DragDropMatch'
import Spelling from './Spelling'
import { createClient } from '@/lib/supabase/client'

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

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

/**
 * Builds the activity step sequence interleaved per item:
 *   Lesson Card A → Sign to Picture A → Spelling A
 *   Lesson Card B → Sign to Picture B → Spelling B
 *   Lesson Card C → Sign to Picture C → Spelling C
 *   Drag & Drop [A, B, C]   ← review every 3 items
 *   Lesson Card D → ...
 *
 * Quiz mode skips Lesson Cards and shuffles items.
 * Drag & Drop is always grouped (needs 3 items); final group is padded if ≥ 2 items remain.
 */
function buildSteps(submodule: SubModule, mode: 'activity' | 'quiz'): ActivityStep[] {
  const items = mode === 'quiz' ? shuffle(submodule.items) : submodule.items
  const hasDragDrop = submodule.activitySequence.includes('drag-drop-match')

  // Per-item types in config order, excluding drag-drop (handled separately)
  const perItemTypes = submodule.activitySequence.filter((t) => t !== 'drag-drop-match')
  const activeTypes = mode === 'quiz'
    ? perItemTypes.filter((t) => t !== 'lesson-card')
    : perItemTypes

  const steps: ActivityStep[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // Per-item activities in configured order
    for (const type of activeTypes) {
      if (type === 'lesson-card') {
        steps.push({ type, item })
      } else if (type === 'sign-to-picture') {
        const distractors = shuffle(items.filter((it) => it.id !== item.id))
        steps.push({ type, item, distractors })
      } else if (type === 'spelling') {
        steps.push({ type, item })
      }
    }

    // Drag & Drop inserted after every 3 items, or at the end if ≥ 2 remain
    if (hasDragDrop) {
      const posInGroup = (i + 1) % 3  // 1, 2, 0  (0 = just completed a full group)
      const isGroupComplete = posInGroup === 0
      const isLastItem = i === items.length - 1

      if (isGroupComplete) {
        const group = items.slice(i - 2, i + 1)
        steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group })
      } else if (isLastItem && posInGroup >= 2) {
        // 2 items left in the final group — pad to 3 with the first item
        const group = items.slice(i - (posInGroup - 1), i + 1)
        while (group.length < 3) group.push(items[0])
        steps.push({ type: 'drag-drop-match', item: group[0], groupItems: group.slice(0, 3) })
      }
      // 1 remaining item at end — skip drag-drop (not enough for a meaningful match)
    }
  }

  return steps
}

export default function ActivityRunner({ module: mod, submodule, mode, attemptId }: Props) {
  const router = useRouter()
  const steps = useMemo(() => buildSteps(submodule, mode), [submodule, mode])
  const [stepIndex, setStepIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [finished, setFinished] = useState(false)

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
  }

  if (finished) {
    const scorableCount = steps.filter((s) => s.type !== 'lesson-card').length
    const percent = scorableCount > 0 ? Math.round((score / scorableCount) * 100) : 100

    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 gap-6 text-center">
        <div className="text-6xl">{percent >= 80 ? '🎉' : percent >= 50 ? '🙂' : '💪'}</div>
        <div>
          <h2 className="text-2xl font-bold">{mode === 'quiz' ? 'Quiz complete!' : 'Activity complete!'}</h2>
          {scorableCount > 0 && (
            <p className="text-muted-foreground mt-1">
              You got <strong>{score}/{scorableCount}</strong> ({percent}%) correct
            </p>
          )}
        </div>
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
            onNext={(correct) => handleNext(correct, undefined)}
          />
        )}
        {current.type === 'drag-drop-match' && (
          <DragDropMatch
            items={current.groupItems ?? [current.item]}
            onNext={(correct) => handleNext(correct, undefined)}
          />
        )}
        {current.type === 'spelling' && (
          <Spelling
            item={current.item}
            onNext={(correct) => handleNext(correct, undefined)}
          />
        )}
      </div>
    </div>
  )
}
