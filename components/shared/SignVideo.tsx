'use client'

import { useEffect, useRef } from 'react'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface Props {
  videoPath: string
  className?: string
}

/**
 * Renders a sign's video — a plain <video> for built-in (file-hosted)
 * signs, or an embedded iframe for a teacher-added YouTube link.
 *
 * The iframe is created and torn down imperatively via a ref, never
 * rendered directly as JSX — React owns only the wrapping <div>. A
 * raw <iframe> managed directly by React's reconciler is vulnerable to
 * a "removeChild: not a child of this node" crash under React Strict
 * Mode's dev-only double-mount: the browser starts navigating the
 * iframe the instant it's inserted, and if Strict Mode's immediate
 * unmount/remount races that, React can lose track of the node. Since
 * this component never lets React touch the iframe itself, that race
 * can't happen.
 */
export default function SignVideo({ videoPath, className }: Props) {
  const parsed = parseVideoUrl(videoPath)
  const containerRef = useRef<HTMLDivElement>(null)
  const isEmbed = parsed.source === 'youtube'

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isEmbed || !parsed.embedUrl) return

    // modestbranding/rel/iv_load_policy/fs/disablekb trim YouTube's own
    // chrome (title bar, related-videos overlay, annotations, fullscreen
    // button) as much as their embed API allows — full removal of the
    // YouTube logo/watermark isn't possible, that's fixed by their terms.
    const params = new URLSearchParams({
      autoplay: '1', mute: '1', loop: '1', playlist: parsed.id ?? '',
      controls: '0', playsinline: '1', modestbranding: '1', rel: '0',
      iv_load_policy: '3', fs: '0', disablekb: '1',
    })
    const src = `${parsed.embedUrl}?${params.toString()}`

    const iframe = document.createElement('iframe')
    iframe.src = src
    iframe.className = 'h-full w-full'
    iframe.setAttribute('allow', 'autoplay; encrypted-media')
    iframe.setAttribute('frameborder', '0')
    container.appendChild(iframe)

    return () => {
      if (iframe.parentNode === container) container.removeChild(iframe)
    }
  }, [isEmbed, parsed.embedUrl, parsed.id])

  if (isEmbed) {
    return <div ref={containerRef} className={className} />
  }

  return (
    <video
      key={videoPath}
      src={videoPath}
      autoPlay
      loop
      playsInline
      muted
      className={className}
    />
  )
}
