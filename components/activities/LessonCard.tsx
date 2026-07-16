'use client'

import type { SignItem } from '@/content/types'
import Image from 'next/image'

interface Props {
  item: SignItem
}

export default function LessonCard({ item }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:w-3/4 lg:mx-auto">
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
    </div>
  )
}
