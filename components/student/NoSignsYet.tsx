import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  backHref: string
}

/** Shown in place of Learn/Practice when a sub-module has no signs yet — avoids the blank/crashed screen those flows hit with an empty item list. */
export default function NoSignsYet({ backHref }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-4xl">📭</p>
      <h2 className="text-xl font-bold">No signs yet</h2>
      <p className="text-muted-foreground max-w-xs">Your teacher hasn&apos;t added any signs to this section yet.</p>
      <Link href={backHref} className="mt-2 inline-flex items-center gap-1 font-semibold text-[#007B89]">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
    </div>
  )
}
