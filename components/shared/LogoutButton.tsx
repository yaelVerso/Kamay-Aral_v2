'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant="outline"
      className="min-w-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  )
}
