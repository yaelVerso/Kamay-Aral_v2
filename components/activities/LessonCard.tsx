'use client'

import type { SignItem } from '@/content/types'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Props {
  item: SignItem
  onNext: () => void
}

export default function LessonCard({ item, onNext }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-muted-foreground">
        Learn this sign
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

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xs border-2 border-[#DAD2C5]">
        <span className="text-6xl font-black tracking-tight text-[#007B89]">{item.label}</span>
        {item.labelFil && <span className="text-base text-muted-foreground">{item.labelFil}</span>}
        {item.imagePath && (
          <div className="relative h-28 w-28 mt-1">
            <Image src={item.imagePath} alt={item.label} fill className="object-contain" />
          </div>
        )}
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] hover:bg-[#00B7CB] py-6 text-lg font-semibold"
      >
        Got it →
      </Button>
    </div>
  )
}
