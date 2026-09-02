'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface YoutubePlayerHandle {
  play: () => void
  pause: () => void
}

interface Props {
  videoId: string
  className?: string
  autoplay: boolean
  looping: boolean
  playbackRate: number
  onPauseChange: (paused: boolean) => void
}

// Minimal shape of the YouTube IFrame Player API surface this component
// uses — no official types package is installed for it.
interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  setPlaybackRate(rate: number): void
  destroy(): void
}

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiLoadPromise: Promise<void> | null = null

// Loads the YouTube IFrame API once per page load, however many players
// mount. Inserted via the DOM from within this already-running (nonced)
// component code — CSP's strict-dynamic propagates trust to scripts
// loaded this way, so youtube.com doesn't need to be added to script-src.
function loadYoutubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (apiLoadPromise) return apiLoadPromise

  apiLoadPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiLoadPromise
}

/**
 * Full play/pause/loop/speed parity with the built-in <video> controls,
 * for YouTube-sourced custom signs — only possible via YouTube's real
 * player API, not a plain iframe. (Google Drive was tried as a second
 * source but dropped — no equivalent public API, plus embed issues with
 * no fix available: cropping, no controls, no autoplay, broken layout
 * on narrow viewports.)
 *
 * React owns only the outer wrapper div. A throwaway inner "mount point"
 * div is created imperatively and handed to YT.Player — YouTube's API
 * replaces whatever element it's given with its own iframe, so that
 * element must never be one React itself tracks, or React's reconciler
 * and YouTube's DOM surgery end up fighting over the same node.
 */
const YoutubeLearnPlayer = forwardRef<YoutubePlayerHandle, Props>(function YoutubeLearnPlayer(
  { videoId, className, autoplay, looping, playbackRate, onPauseChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const loopingRef = useRef(looping)
  const playbackRateRef = useRef(playbackRate)

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
  }), [])

  useEffect(() => { loopingRef.current = looping }, [looping])

  useEffect(() => {
    playbackRateRef.current = playbackRate
    playerRef.current?.setPlaybackRate(playbackRate)
  }, [playbackRate])

  useEffect(() => {
    let destroyed = false
    const container = containerRef.current
    if (!container) return

    const mountPoint = document.createElement('div')
    // Without an explicit size, YT.Player defaults to a fixed 640x390px
    // iframe regardless of its container — establish a real box for it
    // to fill before creating the player.
    mountPoint.style.width = '100%'
    mountPoint.style.height = '100%'
    container.appendChild(mountPoint)

    loadYoutubeApi().then(() => {
      if (destroyed || !window.YT) return
      playerRef.current = new window.YT.Player(mountPoint, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
        },
        events: {
          onReady: () => {
            playerRef.current?.setPlaybackRate(playbackRateRef.current)
          },
          // 1 = playing, 2 = paused, 0 = ended
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) onPauseChange(false)
            if (e.data === 2) onPauseChange(true)
            if (e.data === 0) {
              onPauseChange(true)
              if (loopingRef.current) {
                playerRef.current?.seekTo(0, true)
                playerRef.current?.playVideo()
              }
            }
          },
        },
      })
    })

    return () => {
      destroyed = true
      playerRef.current?.destroy()
      playerRef.current = null
      // YT.Player already replaced mountPoint with its own iframe by now —
      // only remove it if it's still actually there (e.g. API never loaded).
      if (mountPoint.parentNode === container) container.removeChild(mountPoint)
    }
    // videoId is the only thing that should remount the player — the rest
    // are synced live via the effects/imperative handle above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  return <div ref={containerRef} className={className} />
})

export default YoutubeLearnPlayer
