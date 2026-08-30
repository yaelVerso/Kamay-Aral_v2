'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  submoduleId: string
  initialTitle: string
  initialShortTitle: string
}

export default function EditCustomSubmoduleDialog({ submoduleId, initialTitle, initialShortTitle }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [shortTitle, setShortTitle] = useState(initialShortTitle)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !shortTitle.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('custom_submodules').update({
        title: trimmedTitle,
        short_title: shortTitle.trim(),
      }).eq('id', submoduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_submodule.update', description: `updated sub-module "${trimmedTitle}"` })
      toast.success('Sub-module updated')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update sub-module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        aria-label="Edit sub-module"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sub-module</DialogTitle>
          <DialogDescription>Update this sub-module&apos;s details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="edit-submodule-title">Title</Label>
            <Input id="edit-submodule-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-submodule-short-title">Short label (for tabs/nav)</Label>
            <Input id="edit-submodule-short-title" value={shortTitle} onChange={(e) => setShortTitle(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim() || !shortTitle.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
