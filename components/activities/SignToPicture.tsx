'use client'

import { useState } from 'react'
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
  /** Previously saved choice id, if this step was already answered (quiz: editable, activity: view-only). */
  initialAnswer?: string | null
  onAnswer: (correct: boolean, answerGiven: string) => void
}

export default function SignToPicture({ item, distractors, mode, initialAnswer, onAnswer }: Props) {
  const [choices] = useState<SignItem[]>(() => shuffle([item, ...distractors.slice(0, 3)]))
  const [selected, setSelected] = useState<string | null>(initialAnswer ?? null)
  // Practice-mode reveal lock only — quiz mode never locks (always editable, never reveals).
  const [locked, setLocked] = useState(mode === 'activity' && !!initialAnswer)
  // Quiz-only "pressed" feedback — true right after Save, pops back up once the choice changes again.
  const [saved, setSaved] = useState(mode === 'quiz' && !!initialAnswer)

  const answered = locked
  const correct = selected === item.id

  function handleSelect(id: string) {
    if (locked) return
    setSelected(id)
    setSaved(false)
  }

  function handleSave() {
    if (!selected) return
    if (mode === 'quiz') {
      onAnswer(selected === item.id, selected)
      setSaved(true)
    } else {
      setLocked(true)
      onAnswer(selected === item.id, selected)
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
              onClick={() => handleSelect(choice.id)}
              disabled={locked}
              className={cn(
                'relative flex flex-col items-center gap-2 rounded-2xl bg-card p-6 shadow-xs border-2 border-[#DAD2C5] transition-all active:scale-95',
                !answered && !isSelected && 'hover:border-[#0BC2D7] border-border bg-card',
                !answered && isSelected && 'border-[#0BC2D7] bg-[#0BC2D7]/10',
                answered && isCorrect && 'border-[#579F10] bg-[#D8F2BF]',
                answered && isSelected && !isCorrect && 'border-[#C61518] bg-[#FFDEDF]',
                answered && !isSelected && !isCorrect && 'border-border bg-card opacity-60',
              )}
            >
              {choice.imagePath ? (
                <>
                  <div className="relative h-20 w-full">
                    <Image src={choice.imagePath} alt={choice.label} fill className="object-contain" />
                  </div>
                  <span className="text-xl font-bold">{choice.label}</span>
                </>
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-3xl font-black text-[var(--brand-secondary)]">
                  {choice.label}
                </div>
              )}
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

      {(mode === 'quiz' || !answered) && (
        <Button
          onClick={handleSave}
          disabled={!selected}
          className={cn(
            'w-full py-6 text-lg font-semibold transition-all disabled:opacity-40',
            mode === 'quiz' && saved
              ? 'bg-[#0BC2D7] shadow-none translate-y-1 opacity-90'
              : 'bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB]',
          )}
        >
          {mode === 'quiz' ? (saved ? 'Saved ✓' : 'Save Answer') : 'Submit Answer'}
        </Button>
      )}
    </div>
  )
}
