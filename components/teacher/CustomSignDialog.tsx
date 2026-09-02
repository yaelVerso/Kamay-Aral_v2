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
import { Plus, Pencil } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface EditingSign {
  id: string
  label: string
  label_fil: string | null
  description: string | null
  video_url: string
  image_url: string | null
  accepted_answers: string[]
}

interface Props {
  submoduleId: string
  nextOrder: number
  editingSign?: EditingSign
}

export default function CustomSignDialog({ submoduleId, nextOrder, editingSign }: Props) {
  const isEdit = !!editingSign
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(editingSign?.label ?? '')
  const [labelFil, setLabelFil] = useState(editingSign?.label_fil ?? '')
  const [description, setDescription] = useState(editingSign?.description ?? '')
  const [videoUrl, setVideoUrl] = useState(editingSign?.video_url ?? '')
  const [imageUrl, setImageUrl] = useState(editingSign?.image_url ?? '')
  const [acceptedAnswers, setAcceptedAnswers] = useState(editingSign?.accepted_answers?.join(', ') ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const parsedVideo = videoUrl.trim() ? parseVideoUrl(videoUrl) : null

  function resetForm() {
    setLabel(editingSign?.label ?? '')
    setLabelFil(editingSign?.label_fil ?? '')
    setDescription(editingSign?.description ?? '')
    setVideoUrl(editingSign?.video_url ?? '')
    setImageUrl(editingSign?.image_url ?? '')
    setAcceptedAnswers(editingSign?.accepted_answers?.join(', ') ?? '')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !videoUrl.trim()) return
    if (!parseVideoUrl(videoUrl).embedUrl) {
      toast.error('Video link must be a YouTube link')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const answers = acceptedAnswers.split(',').map((a) => a.trim()).filter(Boolean)
      const payload = {
        label: label.trim(),
        label_fil: labelFil.trim() || null,
        description: description.trim() || null,
        video_url: videoUrl.trim(),
        image_url: imageUrl.trim() || null,
        accepted_answers: answers.length > 0 ? answers : [label.trim()],
      }

      if (isEdit) {
        const { error } = await supabase.from('custom_signs').update(payload).eq('id', editingSign.id)
        if (error) throw new Error(error.message)
        await recordAuditLog({ action: 'custom_sign.update', description: `updated sign "${payload.label}"` })
        toast.success('Sign updated')
      } else {
        const { error } = await supabase.from('custom_signs').insert({ ...payload, submodule_id: submoduleId, order: nextOrder })
        if (error) throw new Error(error.message)
        await recordAuditLog({ action: 'custom_sign.create', description: `added sign "${payload.label}"` })
        toast.success(`Sign "${payload.label}" added`)
      }

      if (!isEdit) {
        setLabel('')
        setLabelFil('')
        setDescription('')
        setVideoUrl('')
        setImageUrl('')
        setAcceptedAnswers('')
      }
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save sign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) resetForm() }}>
      {isEdit ? (
        <Button variant="ghost" size="icon-xs" onClick={() => setOpen(true)} aria-label="Edit sign">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
          <Plus className="h-4 w-4" />
          Add Sign
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sign' : 'Add Sign'}</DialogTitle>
          <DialogDescription>
            Paste a YouTube link for the sign&apos;s video.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="sign-label">Sign name</Label>
              <Input id="sign-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Apple" required />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="sign-label-fil">Filipino translation</Label>
              <Input id="sign-label-fil" value={labelFil} onChange={(e) => setLabelFil(e.target.value)} placeholder="e.g. Mansanas" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sign-description">Description</Label>
            <textarea
              id="sign-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this sign"
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sign-video">Video link (YouTube)</Label>
            <Input id="sign-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            {videoUrl.trim() && (
              <p className={`text-xs ${parsedVideo?.embedUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                {parsedVideo?.embedUrl
                  ? 'Recognized as YouTube link'
                  : '⚠ Not a recognized YouTube link'}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="sign-image">Image link (optional)</Label>
            <Input id="sign-image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sign-answers">Accepted spelling answers</Label>
            <Input
              id="sign-answers"
              value={acceptedAnswers}
              onChange={(e) => setAcceptedAnswers(e.target.value)}
              placeholder="e.g. apple, mansanas (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">Used for the Spelling activity. Leave blank to just use the sign name.</p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !label.trim() || !videoUrl.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Sign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
