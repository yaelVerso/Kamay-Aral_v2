'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createStudentAction } from '@/app/actions/admin'

interface Props {
  sectionId?: string
  triggerLabel?: string
}

export default function CreateStudentDialog({ sectionId, triggerLabel = 'Create Student Account' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await createStudentAction({ firstName, lastName, email, idNumber, sectionId })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Invite sent to ${email}`)
      setFirstName(''); setLastName(''); setEmail(''); setIdNumber(''); setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create student account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Student Account</DialogTitle>
          <DialogDescription>
            An email invitation will be sent to the address below so the account's password can be set.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Sending invite…' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
