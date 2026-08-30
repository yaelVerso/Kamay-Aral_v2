'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  signId: string
  signLabel: string
}

export default function DeleteCustomSignButton({ signId, signLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${signLabel}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('custom_signs').delete().eq('id', signId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_sign.delete', description: `deleted sign "${signLabel}"` })
      toast.success('Sign deleted')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete sign"
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
