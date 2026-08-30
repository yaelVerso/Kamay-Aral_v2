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
import { MODULE_COLOR_PRESETS } from '@/components/teacher/CreateCustomModuleForm'

interface Props {
  moduleId: string
  initialTitle: string
  initialDescription: string | null
  initialIcon: string
  initialColor: string
}

export default function EditCustomModuleDialog({ moduleId, initialTitle, initialDescription, initialIcon, initialColor }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('custom_modules').update({
        title: trimmedTitle,
        description: description.trim() || null,
        icon: icon.trim() || '📚',
        color,
      }).eq('id', moduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_module.update', description: `updated module "${trimmedTitle}"` })
      toast.success('Module updated')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update module')
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
        aria-label="Edit module"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Module</DialogTitle>
          <DialogDescription>Update this module&apos;s details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-20 shrink-0 space-y-1">
              <Label htmlFor="edit-module-icon">Icon</Label>
              <Input id="edit-module-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="edit-module-title">Title</Label>
              <Input id="edit-module-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-module-description">Description</Label>
            <Input id="edit-module-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {MODULE_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`h-8 w-8 rounded-full border-2 ${preset.value.split(' ')[0]} ${color === preset.value ? 'border-foreground' : 'border-transparent'}`}
                  aria-label={preset.label}
                  title={preset.label}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
