'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { recordAuditLog } from '@/app/actions/audit'

export default function DeleteAdminModuleButton({ moduleId, moduleTitle }: { moduleId: string; moduleTitle: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_modules').delete().eq('id', moduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_module.delete', description: `deleted module "${moduleTitle}"` })
      toast.success(`Module "${moduleTitle}" deleted`)
      router.push('/admin/modules')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete module')
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
        className="gap-1.5 text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
        Delete Module
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete module?"
        description={`Delete "${moduleTitle}"? This deletes every sub-module and sign inside it, for every student. This cannot be undone.`}
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
      />
    </>
  )
}
