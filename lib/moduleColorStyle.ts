import type { CSSProperties } from 'react'

// Module colors are stored as full Tailwind utility strings (e.g.
// "bg-[#FFAB41] shadow-[0_4px_0_#F18701] hover:bg-[#FF9F26]") so the color
// picker UI can render them directly. The problem: Tailwind's compiler only
// generates CSS for classes it can find literally written in scanned source
// files — a value that only exists as a runtime string from the database
// (e.g. a retired preset still referenced by an old module) silently
// compiles to nothing, making the card invisible.
//
// Fix: pull the three hex values out and hand them to the DOM as CSS custom
// properties instead, referenced by a *static* className that's always
// present in source (so it's always compiled) regardless of what color any
// given module actually has.
const STATIC_CLASS = 'bg-[var(--mod-bg)] shadow-[0_4px_0_var(--mod-shadow)] hover:bg-[var(--mod-hover)]'

export function moduleColorStyle(colorClasses: string): { className: string; style: CSSProperties } {
  const bgMatch = colorClasses.match(/bg-\[(#[0-9a-fA-F]{3,8})\]/)
  const shadowMatch = colorClasses.match(/shadow-\[0_4px_0_(#[0-9a-fA-F]{3,8})\]/)
  const hoverMatch = colorClasses.match(/hover:bg-\[(#[0-9a-fA-F]{3,8})\]/)

  const bg = bgMatch?.[1] ?? '#0BC2D7'
  const shadow = shadowMatch?.[1] ?? bg
  const hover = hoverMatch?.[1] ?? bg

  return {
    className: STATIC_CLASS,
    style: {
      '--mod-bg': bg,
      '--mod-shadow': shadow,
      '--mod-hover': hover,
    } as CSSProperties,
  }
}
