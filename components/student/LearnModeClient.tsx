'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Module, SubModule, SignItem } from '@/content/types'
import { ChevronLeft, ChevronRight, Play, Pause, Repeat } from 'lucide-react'
import Link from 'next/link'
import { labelTextSize } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import {
  readBooleanSetting,
  VIDEO_MANUAL_PLAY_STORAGE_KEY,
} from '@/lib/settings'

interface Props {
  module: Module
  submodule: SubModule
}

const SPEEDS = [0.5, 0.75, 1] as const

export default function LearnModeClient({ module: mod, submodule }: Props) {
  const [selectedItem, setSelectedItem] = useState<SignItem>(submodule.items[0])
  const [manualPlay, setManualPlay] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [looping, setLooping] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<(typeof SPEEDS)[number]>(1)
  const [isPaused, setIsPaused] = useState(true)

  useEffect(() => {
    setManualPlay(readBooleanSetting(VIDEO_MANUAL_PLAY_STORAGE_KEY, true))
  }, [])

  // video remounts per item, so playbackRate needs reapplying each time
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate
  }, [selectedItem, playbackRate])

  function togglePause() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  function toggleLoop() {
    setLooping((l) => !l)
  }

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

  // first item bypasses selectItem() via the useState initializer, so mark it viewed here
  useEffect(() => {
    markViewed(submodule.items[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      : 'border-[#DAD2C5] bg-card text-foreground hover:border-[#0BC2D7]'
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
              ref={videoRef}
              src={selectedItem.videoPath}
              controls
              loop={looping}
              autoPlay={!manualPlay}
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
            >
              <source src={selectedItem.videoPath} type="video/mp4" />
            </video>
          </div>

          {/* Video controls — icon-only, supplementing the native scrub bar */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={togglePause}
              aria-label={isPaused ? 'Play' : 'Pause'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DAD2C5] bg-card hover:border-[#0BC2D7] transition-colors"
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleLoop}
              aria-label={looping ? 'Unloop' : 'Loop'}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${looping ? 'border-[#007B89] bg-[#007B89] text-white' : 'border-[#DAD2C5] bg-card hover:border-[#0BC2D7]'
                }`}
            >
              <Repeat className="h-4 w-4" />
            </button>
            <div className="mx-1 h-6 w-px bg-[#DAD2C5]" />
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackRate(speed)}
                aria-label={speed === 1 ? 'Normal speed' : `${speed}x speed`}
                className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-xs font-bold transition-colors ${playbackRate === speed ? 'border-[#007B89] bg-[#007B89] text-white' : 'border-[#DAD2C5] bg-card hover:border-[#0BC2D7]'
                  }`}
              >
                {speed === 1 ? '1x' : `${speed}x`}
              </button>
            ))}
          </div>

          {/* Label + image */}
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-6 shadow-xs border-2 border-[#DAD2C5]">
            <span className={`${labelTextSize(selectedItem.label, ['text-6xl', 'text-4xl', 'text-3xl'])} break-words text-center font-black tracking-tight text-[#007B89]`}>{selectedItem.label}</span>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-card border border-[#DAD2C5] shadow-[0_4px_0_#DAD2C5] py-3 text-lg font-semibold disabled:opacity-40 hover:bg-muted transition-colors"
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
