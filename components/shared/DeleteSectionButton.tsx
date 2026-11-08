'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { deleteSectionAction } from '@/app/actions/admin'

export default function DeleteSectionButton({ sectionId, sectionName, redirectTo }: { sectionId: string; sectionName: string; redirectTo: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteSectionAction(sectionId)
      toast.success(`Section "${sectionName}" deleted`)
      router.push(redirectTo)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete section')
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
        Delete Section
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete section?"
        description={`Delete section "${sectionName}"? Its students will become unassigned, not deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={loading}
        onConfirm={handleDelete}
      />
    </>
  )
}
