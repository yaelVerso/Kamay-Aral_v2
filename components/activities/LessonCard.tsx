'use client'

import type { SignItem } from '@/content/types'
import { labelTextSize } from '@/lib/utils'
import SignVideo from '@/components/shared/SignVideo'
import SignImage from '@/components/shared/SignImage'

interface Props {
  item: SignItem
}

export default function LessonCard({ item }: Props) {
  return (
    <div className="flex flex-col gap-4 lg:w-3/4 lg:mx-auto">
      <p className="text-center text-xl font-semibold uppercase tracking-widest text-muted-foreground">
        Learn this sign
      </p>

      <div className="relative aspect-video w-full min-h-[220px] rounded-2xl bg-black overflow-hidden">
        <SignVideo videoPath={item.videoPath} className="h-full w-full object-contain" />
      </div>

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-xs border-2 border-[#DAD2C5]">
        <span className={`${labelTextSize(item.label, ['text-6xl', 'text-4xl', 'text-3xl'])} break-words text-center font-black tracking-tight text-[#007B89]`}>{item.label}</span>
        {item.labelFil && <span className="text-base text-muted-foreground">{item.labelFil}</span>}
        {item.imagePath && (
          <div className="relative h-28 w-28 mt-1">
            <SignImage src={item.imagePath} alt={item.label} className="object-contain" />
          </div>
        )}
      </div>
    </div>
  )
}
