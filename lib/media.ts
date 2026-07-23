const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const VIDEO_BUCKET = 'videos'
const IMAGE_BUCKET = 'images'

// "/videos/alphabet/a.mp4" -> bucket "videos", path "alphabet/a.mp4"
export function videoUrl(path: string) {
  const cleanPath = path.replace(/^\/?videos\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${cleanPath}`
}

// "/images/alphabet/a.png" -> bucket "images", path "alphabet/a.png"
export function imageUrl(path: string) {
  const cleanPath = path.replace(/^\/?images\//, '')
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${cleanPath}`
}
