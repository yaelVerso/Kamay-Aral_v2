'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  submoduleId: string
  submoduleTitle: string
  moduleId: string
}

export default function DeleteAdminSubmoduleButton({ submoduleId, submoduleTitle, moduleId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${submoduleTitle}"? This deletes every sign inside it, for every student. This cannot be undone.`)) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('admin_submodules').delete().eq('id', submoduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_submodule.delete', description: `deleted sub-module "${submoduleTitle}"` })
      toast.success(`Sub-module "${submoduleTitle}" deleted`)
      router.push(`/admin/modules/${moduleId}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sub-module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="gap-1.5 text-red-600 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
      Delete Sub-module
    </Button>
  )
}
