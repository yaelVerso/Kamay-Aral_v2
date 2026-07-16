'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, GraduationCap, Users, ScrollText, Settings, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { recordAuditLog } from '@/app/actions/audit'

const navItemClass = 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors'

const links = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/faculty', label: 'Faculty Management', icon: GraduationCap },
  { href: '/admin/students', label: 'Student Registry', icon: Users },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await recordAuditLog({ action: 'auth.logout', description: 'logged out' })
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const content = (
    <>
      <Link href="/admin/overview" className="text-lg font-bold text-indigo-600 px-4 py-4 block">
        Kamay Aral Admin
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
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
          href="/admin/settings"
          onClick={() => setOpen(false)}
          className={cn(
            navItemClass,
            pathname.startsWith('/admin/settings')
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button onClick={handleLogout} className={cn(navItemClass, 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-bold text-indigo-600">Kamay Aral Admin</span>
        <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col border-b bg-white pb-2 md:hidden">{content}</div>
      )}

      {/* Desktop sidebar — sticky + h-screen (not min-h-screen) so it stays
          pinned to the viewport instead of stretching to match tall page
          content (e.g. a long audit log list), which pushed Settings/Sign
          out below the fold and required scrolling the whole page to reach. */}
      <aside className="hidden md:flex md:w-70 md:flex-col md:border-r md:bg-white md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        {content}
      </aside>
    </>
  )
}
