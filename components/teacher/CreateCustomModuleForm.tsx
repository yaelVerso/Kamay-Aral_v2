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

export const MODULE_COLOR_PRESETS = [
  { label: 'Green', value: 'bg-[#BBE587] shadow-[0_4px_0_#82B740] hover:bg-[#A6E05F]' },
  { label: 'Blue', value: 'bg-[#8ECAE6] shadow-[0_4px_0_#4A90B8] hover:bg-[#6BB6D6]' },
  { label: 'Yellow', value: 'bg-[#FFD97D] shadow-[0_4px_0_#D9A441] hover:bg-[#FFCB5C]' },
  { label: 'Pink', value: 'bg-[#F7B2BD] shadow-[0_4px_0_#C97D89] hover:bg-[#F492A0]' },
  { label: 'Purple', value: 'bg-[#C9B6E4] shadow-[0_4px_0_#9A7FC0] hover:bg-[#B69EDA]' },
  { label: 'Orange', value: 'bg-[#FFB584] shadow-[0_4px_0_#D97F42] hover:bg-[#FFA366]' },
] as const

export default function CreateCustomModuleForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📚')
  const [color, setColor] = useState<string>(MODULE_COLOR_PRESETS[0].value)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const trimmedTitle = title.trim()
      const { error } = await supabase.from('custom_modules').insert({
        teacher_id: user!.id,
        title: trimmedTitle,
        description: description.trim() || null,
        icon: icon.trim() || '📚',
        color,
      })
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_module.create', description: `created module "${trimmedTitle}"` })
      toast.success(`Module "${trimmedTitle}" created`)
      setTitle('')
      setDescription('')
      setIcon('📚')
      setColor(MODULE_COLOR_PRESETS[0].value)
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create module')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
        <Plus className="h-4 w-4" />
        New Module
      </Button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="w-20 shrink-0 space-y-1">
          <Label htmlFor="module-icon">Icon</Label>
          <Input id="module-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📚" maxLength={4} />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="module-title">Title</Label>
          <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Classroom Objects" required />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="module-description">Description</Label>
        <Input id="module-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description shown on the module card" />
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
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
          {loading ? 'Creating…' : 'Create Module'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}
