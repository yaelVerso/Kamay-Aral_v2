'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  readBooleanSetting,
  VIDEO_MANUAL_PLAY_STORAGE_KEY,
} from '@/lib/settings'

export default function VideoPlaybackSettings() {
  const [manualPlay, setManualPlay] = useState(true)

  useEffect(() => {
    setManualPlay(readBooleanSetting(VIDEO_MANUAL_PLAY_STORAGE_KEY, true))
  }, [])

  function applyManualPlay(checked: boolean) {
    setManualPlay(checked)
    localStorage.setItem(VIDEO_MANUAL_PLAY_STORAGE_KEY, String(checked))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Manual Play</p>
          <p className="text-xs text-muted-foreground">Videos wait for a tap on Play instead of starting on their own.</p>
        </div>
        <Switch checked={manualPlay} onCheckedChange={applyManualPlay} />
      </div>
    </div>
  )
}
