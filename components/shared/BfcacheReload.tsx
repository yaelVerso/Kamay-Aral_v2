'use client'

import { useEffect } from 'react'

/**
 * Chrome can still restore a page from bfcache even with Cache-Control: no-store,
 * so a stale authenticated view can flash back in after sign-out + browser back.
 * event.persisted flags a bfcache restore — reload forces a fresh request through
 * the auth middleware instead of trusting the cached snapshot.
 */
export default function BfcacheReload() {
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  return null
}
