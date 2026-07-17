/** localStorage keys for persisted personalization settings, shared between
 * the settings-page toggles (writers) and the components that read them. */
export const THEME_STORAGE_KEY = 'theme'
export const VIDEO_AUTO_REPLAY_STORAGE_KEY = 'videoAutoReplay'
export const VIDEO_MANUAL_PLAY_STORAGE_KEY = 'videoManualPlay'

export function readBooleanSetting(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const saved = window.localStorage.getItem(key)
  if (saved === null) return fallback
  return saved === 'true'
}
