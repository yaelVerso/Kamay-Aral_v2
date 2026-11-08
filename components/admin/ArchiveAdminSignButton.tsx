'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Archive, ArchiveRestore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  signId: string
  signLabel: string
  isActive: boolean
}

export default function ArchiveAdminSignButton({ signId, signLabel, isActive }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_signs').update({ is_active: !isActive }).eq('id', signId)
      if (error) throw new Error(error.message)
      await recordAuditLog({
        action: isActive ? 'admin_sign.archive' : 'admin_sign.restore',
        description: `${isActive ? 'archived' : 'restored'} sign "${signLabel}"`,
      })
      toast.success(`Sign "${signLabel}" ${isActive ? 'archived' : 'restored'}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${isActive ? 'archive' : 'restore'} sign`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        aria-label={isActive ? 'Archive sign' : 'Restore sign'}
        className={isActive ? 'text-muted-foreground hover:text-amber-600' : 'text-emerald-600 hover:text-emerald-700'}
      >
        {isActive ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? 'Archive sign?' : 'Restore sign?'}
        description={
          isActive
            ? `Archive "${signLabel}"? It will be hidden from students and teachers, but can be restored later.`
            : `Restore "${signLabel}"? It will become visible to students and teachers again.`
        }
        confirmLabel={isActive ? 'Archive' : 'Restore'}
        destructive={isActive}
        loading={loading}
        onConfirm={handleToggle}
      />
    </>
  )
}
