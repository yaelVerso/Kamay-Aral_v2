'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { renameSectionAction } from '@/app/actions/admin'

export default function EditSectionNameButton({ sectionId, sectionName }: { sectionId: string; sectionName: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(sectionName)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === sectionName) {
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      await renameSectionAction(sectionId, name)
      toast.success('Section renamed')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename section')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => { setName(sectionName); setOpen(true) }}
      >
        <Pencil className="h-4 w-4" />
        Edit Name
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Section name"
              autoFocus
            />
            <DialogFooter>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
