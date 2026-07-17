'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { THEME_STORAGE_KEY } from '@/lib/settings'

export default function ThemeToggle() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(document.documentElement.classList.contains('dark'))
  }, [])

  function apply(checked: boolean) {
    setEnabled(checked)
    localStorage.setItem(THEME_STORAGE_KEY, checked ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', checked)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Warm Dark Theme</p>
        <p className="text-xs text-muted-foreground">Easier on the eyes in low light.</p>
      </div>
      <Switch checked={enabled} onCheckedChange={apply} />
    </div>
  )
}
