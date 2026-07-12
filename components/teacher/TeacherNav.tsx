'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { recordAuditLog } from '@/app/actions/audit'

const links = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teacher/sections', label: 'Sections', icon: Users },
]

export default function TeacherNav() {
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
      <Link href="/teacher/dashboard" className="text-2xl font-black text-white p-6 block">
        Kamay Aral
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
                'flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition-colors',
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
      <div className="mt-auto px-2 pb-4">
        <Button variant="ghost" size="lg" onClick={handleLogout} className="w-full justify-start gap-1.5 text-white">
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-[#007B89] px-4 py-3 md:hidden">
        <span className="text-lg font-bold text-white">Kamay Aral</span>
        <button onClick={() => setOpen((o) => !o)} className="text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col border-b bg-[#007B89] pb-2 md:hidden">{content}</div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-70 md:flex-col md:border-r md:bg-[#007B89] md:min-h-screen">
        {content}
      </aside>
    </>
  )
}
