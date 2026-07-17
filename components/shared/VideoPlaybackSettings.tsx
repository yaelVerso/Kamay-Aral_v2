'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  readBooleanSetting,
  VIDEO_AUTO_REPLAY_STORAGE_KEY,
  VIDEO_MANUAL_PLAY_STORAGE_KEY,
} from '@/lib/settings'

export default function VideoPlaybackSettings() {
  const [autoReplay, setAutoReplay] = useState(false)
  const [manualPlay, setManualPlay] = useState(true)

  useEffect(() => {
    setAutoReplay(readBooleanSetting(VIDEO_AUTO_REPLAY_STORAGE_KEY, false))
    setManualPlay(readBooleanSetting(VIDEO_MANUAL_PLAY_STORAGE_KEY, true))
  }, [])

  function applyAutoReplay(checked: boolean) {
    setAutoReplay(checked)
    localStorage.setItem(VIDEO_AUTO_REPLAY_STORAGE_KEY, String(checked))
  }

  function applyManualPlay(checked: boolean) {
    setManualPlay(checked)
    localStorage.setItem(VIDEO_MANUAL_PLAY_STORAGE_KEY, String(checked))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Auto-Replay Videos</p>
          <p className="text-xs text-muted-foreground">Sign videos loop on their own once they finish.</p>
        </div>
        <Switch checked={autoReplay} onCheckedChange={applyAutoReplay} />
      </div>

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
