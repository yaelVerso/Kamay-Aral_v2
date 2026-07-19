'use client'

import { useState } from 'react'
import type { SignItem } from '@/content/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { shuffle } from '@/lib/shuffle'

interface MatchResult {
  itemId: string
  correct: boolean
  matchedLabel: string
}

// One distinct color per pair slot (by the item's stable position in `items`,
// not display order) so a matched video/picture pair are visually linked by
// color instead of everything turning the same generic blue.
const PAIR_COLORS = [
  { border: 'border-[#8B5CF6]', bg: 'bg-[#EDE6FB]', text: 'text-[#6D28D9]' },
  { border: 'border-[#0BC2D7]', bg: 'bg-[#D5ECEF]', text: 'text-[#007B89]' },
  { border: 'border-[#F472B6]', bg: 'bg-[#FCE7F3]', text: 'text-[#BE185D]' },
]

interface Props {
  items: SignItem[]   // exactly 3
  mode: 'activity' | 'quiz'
  /** Previously saved matches (videoId -> pictureId), if this step was already answered. */
  initialMatches?: Record<string, string> | null
  onAnswer: (results: MatchResult[]) => void
}

export default function DragDropMatch({ items, mode, initialMatches, onAnswer }: Props) {
  const [videoOrder] = useState<SignItem[]>(() => shuffle(items))
  const [pictureOrder] = useState<SignItem[]>(() => shuffle(items))
  // matches[videoId] = pictureId
  const [matches, setMatches] = useState<Record<string, string>>(initialMatches ?? {})
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  // Practice-mode reveal lock only — quiz mode never locks (always editable, never reveals).
  const [locked, setLocked] = useState(mode === 'activity' && !!initialMatches)
  // Quiz-only "pressed" feedback — true right after Save, pops back up once a match changes again.
  const [saved, setSaved] = useState(mode === 'quiz' && !!initialMatches)

  function handleVideoTap(id: string) {
    if (locked) return
    setSelectedVideo((prev) => (prev === id ? null : id))
  }

  function handlePictureTap(pictureId: string) {
    if (!selectedVideo || locked) return

    // If this picture is already matched to something else, swap it out
    const existingVideoForPicture = Object.entries(matches).find(([, pId]) => pId === pictureId)?.[0]

    setMatches((prev) => {
      const next = { ...prev }
      if (existingVideoForPicture) delete next[existingVideoForPicture]
      // Remove any prior match for selectedVideo
      next[selectedVideo] = pictureId
      return next
    })
    setSelectedVideo(null)
    setSaved(false)
  }

  const allMatched = Object.keys(matches).length === items.length

  function handleSubmit() {
    if (!allMatched) return
    const results: MatchResult[] = items.map((item) => ({
      itemId: item.id,
      correct: matches[item.id] === item.id,
      matchedLabel: matches[item.id] ?? '',
    }))
    if (mode === 'quiz') {
      onAnswer(results)
      setSaved(true)
    } else {
      setLocked(true)
      onAnswer(results)
    }
  }

  const allCorrect = locked && items.every((item) => matches[item.id] === item.id)
  const score = locked ? items.filter((item) => matches[item.id] === item.id).length : 0

  function pairColor(itemId: string) {
    const idx = items.findIndex((i) => i.id === itemId)
    return PAIR_COLORS[idx % PAIR_COLORS.length]
  }

  return (
    <div className="flex flex-col gap-4 lg:w-3/4 lg:mx-auto">
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-muted-foreground">
        Match the sign to the picture
      </p>
      {selectedVideo && (
        <p className="text-center text-lg text-[#007B89] font-medium">
          Now tap the matching picture →
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Videos column */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-center text-muted-foreground uppercase">Signs</p>
          {videoOrder.map((item) => {
            const isSelected = selectedVideo === item.id
            const matchedPictureId = matches[item.id]
            const matchedItem = matchedPictureId ? items.find((i) => i.id === matchedPictureId) : null
            const isCorrect = locked && matchedPictureId === item.id
            const color = pairColor(item.id)

            return (
              <button
                key={item.id}
                onClick={() => handleVideoTap(item.id)}
                className={cn(
                  'relative w-full rounded-xl overflow-hidden border-3 transition-all active:scale-95',
                  isSelected && 'border-slate-400 ring-3 ring-slate-300',
                  !isSelected && matchedItem && !locked && color.border,
                  !isSelected && !(matchedItem && !locked) && !locked && 'border-transparent',
                  locked && isCorrect && 'border-emerald-500 bg-emerald-50',
                  locked && !isCorrect && 'border-red-500 bg-red-50',
                )}
              >
                <video
                  src={item.videoPath}
                  autoPlay
                  loop
                  playsInline
                  muted
                  className="aspect-video w-full object-contain bg-black"
                />
                {matchedItem && !locked && (
                  <div className={cn('px-2 py-1 text-center text-xs font-semibold', color.bg, color.text)}>
                    → {matchedItem.label}
                  </div>
                )}
                {locked && (
                  <div className={cn('absolute right-1 top-1', isCorrect ? 'text-[#579F10]' : 'text-[#C61518]')}>
                    {isCorrect ? <CheckCircle2 className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Pictures column */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-center text-muted-foreground uppercase">Pictures</p>
          {pictureOrder.map((item) => {
            const matchedVideoId = Object.entries(matches).find(([, pId]) => pId === item.id)?.[0]
            const isMatched = matchedVideoId !== undefined
            const matchedCorrectly = locked && matches[item.id] === item.id
            const color = matchedVideoId ? pairColor(matchedVideoId) : null

            return (
              <button
                key={item.id}
                onClick={() => handlePictureTap(item.id)}
                disabled={locked}
                className={cn(
                  'relative aspect-video flex w-full flex-col items-center justify-center rounded-xl border-3 p-2 transition-all active:scale-95',
                  selectedVideo && !isMatched ? 'border-[#D9BA87] bg-[#ECE7DF]' : 'border-[#DAD2C5] bg-card',
                  isMatched && !locked && color && cn(color.border, color.bg),
                  locked && matchedCorrectly && 'border-[#579F10] bg-[#D8F2BF]',
                  locked && !matchedCorrectly && isMatched && 'border-[#C61518] bg-[#FFDEDF]',
                )}
              >
                {item.imagePath ? (
                  <>
                    <div className="relative min-h-0 w-full flex-1">
                      <Image
                        src={item.imagePath}
                        alt={item.label}
                        fill
                        sizes="(max-width: 1023px) 50vw, 25vw"
                        className="object-contain"
                      />
                    </div>
                    <span className="text-2xl font-bold mt-3">{item.label}</span>
                  </>
                ) : (
                  <span className="flex min-h-0 w-full flex-1 items-center justify-center text-2xl font-black text-[var(--brand-secondary)]">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {locked && (
        <div className={cn(
          'rounded-2xl p-4 text-center',
          allCorrect ? 'bg-[#D8F2BF] text-[#579F10] ' : 'bg-[#FFECB7] text-[#FFA93C]',
        )}>
          <p className="font-bold text-lg">{allCorrect ? '🎉 Perfect match!' : `${score}/3 correct`}</p>
        </div>
      )}

      {(mode === 'quiz' || !locked) && (
        <Button
          onClick={handleSubmit}
          disabled={!allMatched}
          className={cn(
            'w-full py-6 text-base font-semibold transition-all disabled:opacity-40',
            mode === 'quiz' && saved
              ? 'bg-[#0BC2D7] shadow-none translate-y-1 opacity-90'
              : 'bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB]',
          )}
        >
          {mode === 'quiz' ? (saved ? 'Saved ✓' : 'Save Answer') : 'Check answers'}
        </Button>
      )}
    </div>
  )
}
