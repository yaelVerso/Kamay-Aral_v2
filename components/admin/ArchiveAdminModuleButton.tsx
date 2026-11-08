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
  moduleId: string
  moduleTitle: string
  isActive: boolean
}

export default function ArchiveAdminModuleButton({ moduleId, moduleTitle, isActive }: Props) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_modules').update({ is_active: !isActive }).eq('id', moduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({
        action: isActive ? 'admin_module.archive' : 'admin_module.restore',
        description: `${isActive ? 'archived' : 'restored'} module "${moduleTitle}"`,
      })
      toast.success(`Module "${moduleTitle}" ${isActive ? 'archived' : 'restored'}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${isActive ? 'archive' : 'restore'} module`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className={isActive ? 'gap-1.5 text-amber-600 hover:text-amber-700' : 'gap-1.5 text-emerald-600 hover:text-emerald-700'}
      >
        {isActive ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
        {isActive ? 'Archive Module' : 'Restore Module'}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? 'Archive module?' : 'Restore module?'}
        description={
          isActive
            ? `Archive "${moduleTitle}"? It will be hidden from students and teachers, but can be restored later.`
            : `Restore "${moduleTitle}"? It will become visible to students and teachers again.`
        }
        confirmLabel={isActive ? 'Archive' : 'Restore'}
        destructive={isActive}
        loading={loading}
        onConfirm={handleToggle}
      />
    </>
  )
}
