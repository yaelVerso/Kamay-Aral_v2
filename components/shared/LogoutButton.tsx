'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await recordAuditLog({ action: 'auth.logout', description: 'logged out' })
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant="outline"
      className="w-full max-w-xs gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  )
}
