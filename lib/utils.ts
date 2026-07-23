import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// smaller text-size class as a label gets longer — sizes ordered largest to smallest
export function labelTextSize(label: string, sizes: readonly string[]): string {
  const len = label.length
  if (len > 14) return sizes[Math.min(2, sizes.length - 1)]
  if (len > 8) return sizes[Math.min(1, sizes.length - 1)]
  return sizes[0]
}
