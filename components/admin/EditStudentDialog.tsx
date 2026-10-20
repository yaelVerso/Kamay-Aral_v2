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
import { updateStudentAction } from '@/app/actions/admin'

interface SectionOption {
  id: string
  name: string
  teacherName: string
}

interface Props {
  studentId: string
  firstName: string
  lastName: string
  email: string
  idNumber: string
  sectionId: string | null
  sections: SectionOption[]
}

export default function EditStudentDialog({ studentId, firstName: initialFirst, lastName: initialLast, email: initialEmail, idNumber: initialIdNumber, sectionId: initialSectionId, sections }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(initialFirst)
  const [lastName, setLastName] = useState(initialLast)
  const [email, setEmail] = useState(initialEmail)
  const [idNumber, setIdNumber] = useState(initialIdNumber)
  const [sectionId, setSectionId] = useState(initialSectionId ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await updateStudentAction({
        studentId,
        firstName,
        lastName,
        email,
        idNumber,
        sectionId: sectionId || null,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Student account updated')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update student account')
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
          <DialogTitle>Edit Student Account</DialogTitle>
          <DialogDescription>Update this student&apos;s profile information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-idNumber">ID Number</Label>
            <Input id="edit-idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-firstName">First Name</Label>
            <Input id="edit-firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-lastName">Last Name</Label>
            <Input id="edit-lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-section">Section</Label>
            <select
              id="edit-section"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.teacherName}</option>
              ))}
            </select>
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
