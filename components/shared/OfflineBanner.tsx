'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    function onOffline() {
      setOffline(true)
    }
    function onOnline() {
      setOffline(false)
    }
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4 shrink-0" />
      No internet connection — some features may not work
    </div>
  )
}
