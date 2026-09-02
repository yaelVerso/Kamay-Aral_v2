import Image from 'next/image'

interface Props {
  src: string
  alt: string
  className?: string
  sizes?: string
}

// A Drive "share" link (drive.google.com/file/d/ID/view) is Drive's HTML
// viewer page, not raw image bytes — a plain <img> can't render it as-is.
// Rewritten to Drive's thumbnail endpoint, which does serve the actual
// image for a publicly-shared file.
function resolveImageUrl(src: string): string {
  const match = src.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
  return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : src
}

/**
 * Renders a sign's image — next/image for built-in (relative /images/...)
 * paths, or a plain <img> for teacher-pasted external URLs. next/image
 * refuses any external host not explicitly allow-listed in next.config.ts,
 * which we can't predict for arbitrary teacher-pasted links, so those
 * bypass Next's Image Optimization instead. Always fills its parent —
 * the caller wraps this in a `relative` container, same as next/image's
 * `fill` prop usage it replaces.
 */
export default function SignImage({ src, alt, className, sizes }: Props) {
  const isExternal = /^https?:\/\//i.test(src)

  if (isExternal) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolveImageUrl(src)} alt={alt} className={`absolute inset-0 h-full w-full ${className ?? ''}`} />
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className={className} />
}
