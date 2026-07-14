'use client'

import { useState, useRef, useEffect } from 'react'
import type { SignItem } from '@/content/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  item: SignItem
  mode: 'activity' | 'quiz'
  onNext: (correct: boolean, answerGiven?: string) => void
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

export default function Spelling({ item, mode, onNext }: Props) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAnswer('')
    setSubmitted(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [item])

  const isCorrect =
    submitted && item.acceptedAnswers.some((a) => normalize(a) === normalize(answer))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    if (mode === 'quiz') {
      const correct = item.acceptedAnswers.some((a) => normalize(a) === normalize(answer))
      onNext(correct, answer)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:w-3/4 lg:mx-auto">
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-muted-foreground">
        Type what sign this is
      </p>

      <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden">
        <video
          key={item.videoPath}
          src={item.videoPath}
          autoPlay
          loop
          playsInline
          muted
          className="h-full w-full object-contain"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input
            ref={inputRef}
            value={answer}
            onChange={(e) => !submitted && setAnswer(e.target.value)}
            placeholder="Type your answer…"
            className={cn(
              'h-18 text-center !text-2xl md:!text-2xl font-semibold rounded-xl border-2',
              submitted && isCorrect && 'border-[#579F10] bg-[#D8F2BF]',
              submitted && !isCorrect && 'border-[#C61518] bg-[#FFDEDF]',
            )}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            readOnly={submitted}
          />
          {submitted && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCorrect
                ? <CheckCircle2 className="h-10 w-10 text-[#579F10]" />
                : <XCircle className="h-10 w-10 text-[#C61518]" />}
            </div>
          )}
        </div>

        {!submitted ? (
          <Button
            type="submit"
            disabled={!answer.trim()}
            className="w-full py-6 text-lg font-semibold bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB] disabled:opacity-40"
          >
            Check
          </Button>
        ) : (
          <>
            <div className={cn(
              'rounded-2xl p-4 text-center',
              isCorrect ? 'bg-[#D8F2BF] text-[#579F10]' : 'bg-[#FFDEDF] text-[#C61518]',
            )}>
              <p className="font-bold text-lg">{isCorrect ? '🎉 Correct!' : '❌ Not quite'}</p>
              {!isCorrect && (
                <p className="text-sm mt-1">
                  Correct Answer: <strong>{item.acceptedAnswers.join(' / ')}</strong>
                </p>
              )}
            </div>
            <Button
              onClick={() => onNext(isCorrect)}
              className={cn('w-full py-6 text-lg font-semibold', isCorrect ? 'bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB]' : 'bg-[#FCCF52] shadow-[0_4px_0_#D0A530] hover:bg-[#FFC31B]')}
            >
              Continue →
            </Button>
          </>
        )}
      </form>
    </div>
  )
}
