'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'

interface Props {
  moduleId: string
  nextOrder: number
}

export default function CreateCustomSubmoduleForm({ moduleId, nextOrder }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [shortTitle, setShortTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !shortTitle.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('custom_submodules').insert({
        module_id: moduleId,
        title: trimmedTitle,
        short_title: shortTitle.trim(),
        order: nextOrder,
      })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_submodule.create', description: `created sub-module "${trimmedTitle}"` })
      toast.success(`Sub-module "${trimmedTitle}" created`)
      setTitle('')
      setShortTitle('')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sub-module')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-1.5">
        <Plus className="h-4 w-4" />
        New Sub-module
      </Button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <Label htmlFor="submodule-title">Title</Label>
        <Input id="submodule-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fruits and Vegetables" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="submodule-short-title">Short label (for tabs/nav)</Label>
        <Input id="submodule-short-title" value={shortTitle} onChange={(e) => setShortTitle(e.target.value)} placeholder="e.g. Fruits & Veg" required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim() || !shortTitle.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
          {loading ? 'Creating…' : 'Create Sub-module'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}
