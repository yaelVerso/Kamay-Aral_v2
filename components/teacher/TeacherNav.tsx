'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Settings, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { recordAuditLog } from '@/app/actions/audit'

const navItemClass = 'flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors'

const links = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/sections', label: 'Class Management', icon: Users },
]

interface Props {
  systemName: string
  logoUrl: string | null
}

export default function TeacherNav({ systemName, logoUrl }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await recordAuditLog({ action: 'auth.logout', description: 'logged out' })
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const brandLabel = (
    <span className="flex items-center gap-2">
      {logoUrl && <Image src={logoUrl} alt={systemName} width={28} height={28} className="h-7 w-7 object-contain" />}
      {systemName}
    </span>
  )

  const content = (
    <>
      <Link href="/teacher/dashboard" className="text-2xl font-black text-white p-6 block">
        {brandLabel}
      </Link>
      <nav className="flex flex-col gap-1 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                navItemClass,
                active
                  ? 'bg-[#ffffff75] text-white'
                  : 'text-white hover:bg-[#ffffff25]',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto px-2 pb-4 flex flex-col gap-1">
        <Link
          href="/teacher/settings"
          onClick={() => setOpen(false)}
          className={cn(
            navItemClass,
            pathname.startsWith('/teacher/settings')
              ? 'bg-[#ffffff75] text-white'
              : 'text-white hover:bg-[#ffffff25]',
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button onClick={handleLogout} className={cn(navItemClass, 'text-white hover:bg-[#ffffff25]')}>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-[var(--brand-primary)] px-4 py-3 md:hidden">
        <span className="text-lg font-bold text-white">{brandLabel}</span>
        <button onClick={() => setOpen((o) => !o)} className="text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col border-b bg-[var(--brand-primary)] pb-2 md:hidden">{content}</div>
      )}

      {/* h-screen + sticky, not min-h-screen, so it stays pinned instead of stretching with tall content */}
      <aside className="hidden md:flex md:w-70 md:flex-col md:border-r md:bg-[var(--brand-primary)] md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        {content}
      </aside>
    </>
  )
}
