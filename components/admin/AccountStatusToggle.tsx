'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { UserX, UserCheck } from 'lucide-react'

interface Props {
  id: string
  name: string
  isActive: boolean
  entityLabel: 'teacher' | 'student'
  deactivateAction: (id: string) => Promise<void>
  reactivateAction: (id: string) => Promise<void>
}

export default function AccountStatusToggle({ id, name, isActive, entityLabel, deactivateAction, reactivateAction }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      await (isActive ? deactivateAction(id) : reactivateAction(id))
      toast.success(`${name}'s ${entityLabel} account ${isActive ? 'deactivated' : 'reactivated'}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${isActive ? 'deactivate' : 'reactivate'} account`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className={isActive ? 'gap-1.5 text-red-600 hover:text-red-700' : 'gap-1.5 text-emerald-600 hover:text-emerald-700'}
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
      >
        {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        {loading ? 'Working…' : isActive ? 'Deactivate' : 'Reactivate'}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isActive ? 'Deactivate account?' : 'Reactivate account?'}
        description={
          isActive
            ? `Deactivate ${name}'s account? They will not be able to sign in until reactivated.`
            : `Reactivate ${name}'s account? They will be able to sign in again.`
        }
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
        destructive={isActive}
        loading={loading}
        onConfirm={handleToggle}
      />
    </>
  )
}
