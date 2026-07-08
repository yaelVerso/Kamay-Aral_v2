const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const VIDEO_BUCKET = 'videos'
const IMAGE_BUCKET = 'images'

/**
 * Builds a public Supabase Storage URL for a video.
 * Pass the same "/videos/..." style path already used in content files —
 * the leading "/videos/" is stripped since the bucket itself is named "videos".
 * Upload files to Supabase Storage under the matching path, e.g.
 * "/videos/alphabet/a.mp4" -> upload to bucket "videos", path "alphabet/a.mp4".
 */
export function videoUrl(path: string) {
  const cleanPath = path.replace(/^\/?videos\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${cleanPath}`
}

/**
 * Builds a public Supabase Storage URL for an image.
 * Pass the same "/images/..." style path already used in content files —
 * the leading "/images/" is stripped since the bucket itself is named "images".
 * Upload files to Supabase Storage under the matching path, e.g.
 * "/images/alphabet/a.png" -> upload to bucket "images", path "alphabet/a.png".
 */
export function imageUrl(path: string) {
  const cleanPath = path.replace(/^\/?images\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${cleanPath}`
}
