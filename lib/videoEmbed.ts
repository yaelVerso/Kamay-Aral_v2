/**
 * Turns a pasted YouTube or Google Drive share link into an embeddable
 * iframe URL. YouTube (unlisted) is the recommended source — reliable
 * playback with no per-viewer throttling. Drive is accepted as a
 * fallback but can rate-limit under concurrent classroom viewing.
 */
export type VideoSource = 'youtube' | 'drive' | 'unknown'

export interface ParsedVideo {
  source: VideoSource
  embedUrl: string | null
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractDriveId(url: string): string | null {
  const match = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
  return match ? match[1] : null
}

export function parseVideoUrl(url: string): ParsedVideo {
  const trimmed = url.trim()

  const youtubeId = extractYoutubeId(trimmed)
  if (youtubeId) {
    return { source: 'youtube', embedUrl: `https://www.youtube.com/embed/${youtubeId}` }
  }

  const driveId = extractDriveId(trimmed)
  if (driveId) {
    return { source: 'drive', embedUrl: `https://drive.google.com/file/d/${driveId}/preview` }
  }

  return { source: 'unknown', embedUrl: null }
}

export function isValidVideoUrl(url: string): boolean {
  return parseVideoUrl(url).embedUrl !== null
}
