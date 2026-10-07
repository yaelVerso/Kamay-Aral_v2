'use client'

import { usePathname } from 'next/navigation'
import StudentNav from '@/components/student/StudentNav'

// Practice/Quiz are full-screen, single-task flows — the bottom nav sitting
// underneath them is an easy way to accidentally navigate away mid-session
// and lose an in-progress practice attempt (which isn't resumable). Hiding
// it there removes that exit path entirely, rather than trying to intercept
// every possible tap on it.
function isFullscreenActivity(pathname: string): boolean {
  return pathname.endsWith('/activity') || pathname.endsWith('/quiz')
}

export default function StudentChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = isFullscreenActivity(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className={fullscreen ? 'flex-1' : 'flex-1 pb-20'}>
        <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-5xl">
          {children}
        </div>
      </main>
      {!fullscreen && <StudentNav />}
    </div>
  )
}
