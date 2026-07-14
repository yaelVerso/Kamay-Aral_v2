'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SIZES = [
  { id: 'small', label: 'S' },
  { id: 'normal', label: 'M' },
  { id: 'large', label: 'L' },
  { id: 'xl', label: 'XL' },
] as const

type FontSize = (typeof SIZES)[number]['id']

export default function FontSizeControl() {
  const [size, setSize] = useState<FontSize>('normal')

  useEffect(() => {
    const saved = localStorage.getItem('fontSize') as FontSize | null
    if (saved) setSize(saved)
  }, [])

  function apply(next: FontSize) {
    setSize(next)
    localStorage.setItem('fontSize', next)
    if (next === 'normal') {
      document.documentElement.removeAttribute('data-font-size')
    } else {
      document.documentElement.setAttribute('data-font-size', next)
    }
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">Text Size</p>
      <div className="flex gap-2">
        {SIZES.map((s) => (
          <button
            key={s.id}
            onClick={() => apply(s.id)}
            className={cn(
              'flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors',
              size === s.id
                ? 'border-[#0BC2D7] bg-[#0BC2D7]/10 text-[#007B89]'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
