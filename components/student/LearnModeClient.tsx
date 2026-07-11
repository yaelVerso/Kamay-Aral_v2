'use client'

import { useState, useCallback } from 'react'
import type { Module, SubModule, SignItem } from '@/content/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Props {
  module: Module
  submodule: SubModule
}

export default function LearnModeClient({ module: mod, submodule }: Props) {
  const [selectedItem, setSelectedItem] = useState<SignItem>(submodule.items[0])

  const markViewed = useCallback(async (item: SignItem) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('learn_progress').upsert({
      student_id: user.id,
      module_id: mod.id,
      submodule_id: submodule.id,
      item_id: item.id,
    }, { onConflict: 'student_id,module_id,submodule_id,item_id' })
  }, [mod.id, submodule.id])

  function selectItem(item: SignItem) {
    setSelectedItem(item)
    markViewed(item)
  }

  const currentIndex = submodule.items.findIndex((i) => i.id === selectedItem.id)

  function prev() {
    if (currentIndex > 0) selectItem(submodule.items[currentIndex - 1])
  }

  function next() {
    if (currentIndex < submodule.items.length - 1) selectItem(submodule.items[currentIndex + 1])
  }

  const itemButtonClass = (item: SignItem) =>
    `flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all active:scale-95 lg:w-full lg:px-3 ${selectedItem.id === item.id
      ? 'border-[#007B89] bg-[#007B89] text-white'
      : 'border-[#DAD2C5] bg-white text-foreground hover:border-[#0BC2D7]'
    }`

  return (
    <div className="flex flex-col min-h-screen lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-6 pb-3">
        <Link
          href={`/module/${mod.id}`}
          className="flex items-center gap-1 text-base text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          {mod.title}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-base font-bold">{submodule.shortTitle}</span>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 mt-3">
        {/* Item strip — mobile: horizontal scroll, hidden on lg+ */}
        <div className="lg:hidden mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {submodule.items.map((item) => (
              <button key={item.id} onClick={() => selectItem(item)} className={itemButtonClass(item)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Item list — desktop: left sidebar, hidden below lg */}
        <div className="hidden lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:gap-2">
          {submodule.items.map((item) => (
            <button key={item.id} onClick={() => selectItem(item)} className={itemButtonClass(item)}>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main viewer */}
        <div className="flex-1 space-y-4">
          {/* Video */}
          <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden">
            <video
              key={selectedItem.videoPath}
              src={selectedItem.videoPath}
              controls
              playsInline
              className="h-full w-full object-contain"
            >
              <source src={selectedItem.videoPath} type="video/mp4" />
            </video>
          </div>

          {/* Label + image */}
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-xs border-2 border-[#DAD2C5]">
            <span className="text-6xl font-black tracking-tight text-[#007B89]">{selectedItem.label}</span>
            {selectedItem.labelFil && (
              <span className="text-lg text-muted-foreground">{selectedItem.labelFil}</span>
            )}
            {selectedItem.imagePath && (
              <div className="relative h-32 w-32">
                <Image
                  src={selectedItem.imagePath}
                  alt={selectedItem.label}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white border border-[#DAD2C5] shadow-[0_4px_0_#DAD2C5] py-3 text-lg font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
              Previous
            </button>
            <button
              onClick={next}
              disabled={currentIndex === submodule.items.length - 1}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0BC2D7] shadow-[0_4px_0_#149AA9] py-3 text-lg font-semibold text-white disabled:opacity-40 hover:bg-[#00A8BB] transition-colors"
            >
              Next
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
