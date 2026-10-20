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
import { Pencil } from 'lucide-react'
import { updateTeacherAction } from '@/app/actions/admin'

interface Props {
  teacherId: string
  firstName: string
  lastName: string
  email: string
  idNumber: string
}

export default function EditTeacherDialog({ teacherId, firstName: initialFirst, lastName: initialLast, email: initialEmail, idNumber: initialIdNumber }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [email, setEmail] = useState(initialEmail)
  const [idNumber, setIdNumber] = useState(initialIdNumber)
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await updateTeacherAction({ teacherId, firstName, lastName, email, idNumber })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Teacher account updated')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update teacher account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Teacher Account</DialogTitle>
          <DialogDescription>Update this teacher&apos;s profile information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-teacher-idNumber">ID Number</Label>
            <Input id="edit-teacher-idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-teacher-firstName">First Name</Label>
            <Input id="edit-teacher-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-teacher-lastName">Last Name</Label>
            <Input id="edit-teacher-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-teacher-email">Email</Label>
            <Input id="edit-teacher-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
