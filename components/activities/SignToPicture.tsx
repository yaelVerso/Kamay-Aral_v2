'use client'

import { useState, useEffect } from 'react'
import type { SignItem } from '@/content/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shuffle } from '@/lib/shuffle'

interface Props {
  item: SignItem
  distractors: SignItem[]
  mode: 'activity' | 'quiz'
  onNext: (correct: boolean, answerGiven?: string) => void
}

export default function SignToPicture({ item, distractors, mode, onNext }: Props) {
  const [choices, setChoices] = useState<SignItem[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    setChoices(shuffle([item, ...distractors.slice(0, 3)]))
    setSelected(null)
    setLocked(false)
  }, [item, distractors])

  const answered = locked
  const correct = selected === item.id

  function handleConfirm() {
    if (!selected) return
    if (mode === 'quiz') {
      onNext(selected === item.id, selected)
    } else {
      setLocked(true)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:w-3/4 lg:mx-auto">
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-muted-foreground">
        What sign is this?
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

      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice) => {
          const isSelected = selected === choice.id
          const isCorrect = choice.id === item.id

          return (
            <button
              key={choice.id}
              onClick={() => !locked && setSelected(choice.id)}
              disabled={locked}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-xs border-2 border-[#DAD2C5] transition-all active:scale-95',
                !answered && !isSelected && 'hover:border-[#0BC2D7] border-border bg-white',
                !answered && isSelected && 'border-[#0BC2D7] bg-[#0BC2D7]/10',
                answered && isCorrect && 'border-[#579F10] bg-[#D8F2BF]',
                answered && isSelected && !isCorrect && 'border-[#C61518] bg-[#FFDEDF]',
                answered && !isSelected && !isCorrect && 'border-border bg-white opacity-60',
              )}
            >
              {choice.imagePath ? (
                <div className="relative h-20 w-full">
                  <Image src={choice.imagePath} alt={choice.label} fill className="object-contain" />
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-3xl font-black text-indigo-600">
                  {choice.label}
                </div>
              )}
              <span className="text-xl font-bold">{choice.label}</span>
              {answered && isCorrect && (
                <CheckCircle2 className="absolute right-2 top-2 h-10 w-10 text-[#579F10]" />
              )}
              {answered && isSelected && !isCorrect && (
                <XCircle className="absolute right-2 top-2 h-10 w-10 text-[#C61518]" />
              )}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className={cn(
          'rounded-2xl p-4 text-center',
          correct ? 'bg-[#D8F2BF] text-[#579F10]' : 'bg-[#FFDEDF] text-[#C61518]',
        )}>
          <p className="font-bold text-xl">{correct ? '🎉 Correct!' : '❌ Not quite'}</p>
          {!correct && <p className="text-sm mt-1">The correct answer is <strong>{item.label}</strong></p>}
        </div>
      )}

      {answered && (
        <Button
          onClick={() => onNext(correct, selected ?? undefined)}
          className={cn(
            'w-full py-6 text-lg font-semibold',
            correct ? 'bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB]' : 'bg-[#FCCF52] shadow-[0_4px_0_#D0A530] hover:bg-[#FFC31B]',
          )}
        >
          Continue →
        </Button>
      )}

      {!answered && (
        <Button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full py-6 text-lg font-semibold bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB] disabled:opacity-40"
        >
          Submit Answer
        </Button>
      )}
    </div>
  )
}
