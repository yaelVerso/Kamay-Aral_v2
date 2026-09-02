'use client'

import { useState } from 'react'
import type { Module, SubModule } from '@/content/types'
import ActivityRunner, { getQuizQuestionCount } from '@/components/activities/ActivityRunner'
import { Button } from '@/components/ui/button'

interface Props {
  module: Module
  submodule: SubModule
  attemptId: string
  backHref?: string
}

export default function QuizGate({ module: mod, submodule, attemptId, backHref }: Props) {
  const [started, setStarted] = useState(false)

  if (started) {
    return <ActivityRunner module={mod} submodule={submodule} mode="quiz" attemptId={attemptId} backHref={backHref} />
  }

  const questionCount = getQuizQuestionCount(submodule)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 gap-6 text-center">
      <div className="text-5xl">📝</div>
      <div>
        <h1 className="text-2xl font-bold">{submodule.title} Quiz</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">
          This quiz has <strong>{questionCount} questions</strong> and can only be taken <strong>once</strong>.
          Make sure you&apos;re ready before starting.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <Button
          onClick={() => setStarted(true)}
          className="w-full py-6 text-base font-semibold bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]"
        >
          Start Quiz
        </Button>
        <Button variant="outline" className="w-full" onClick={() => history.back()}>
          Not yet
        </Button>
      </div>
    </div>
  )
}
