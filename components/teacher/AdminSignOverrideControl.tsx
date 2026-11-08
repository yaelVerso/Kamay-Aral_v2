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
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { Video } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface Props {
  adminSignId: string
  signLabel: string
  currentOverrideUrl: string | null
}

/**
 * A teacher's own video for an admin/global sign — unlike custom_sign_videos
 * (Learn-mode-only extras a teacher adds to their own content), this
 * genuinely replaces what's used in Learn, Practice, AND Quiz for that
 * teacher's own students. Admin's original stays available as a Learn-mode
 * variation (handled by getAdminModuleTree's override resolution) rather
 * than disappearing. One override per (sign, teacher) — set, replace, or
 * remove here; removing reverts back to admin's original as primary.
 */
export default function AdminSignOverrideControl({ adminSignId, signLabel, currentOverrideUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState(currentOverrideUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  const parsedVideo = videoUrl.trim() ? parseVideoUrl(videoUrl) : null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!videoUrl.trim()) return
    if (!parseVideoUrl(videoUrl).embedUrl) {
      toast.error('Video link must be a YouTube link')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('admin_sign_teacher_overrides').upsert(
        { admin_sign_id: adminSignId, teacher_id: user!.id, video_url: videoUrl.trim() },
        { onConflict: 'admin_sign_id,teacher_id' },
      )
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_sign.set_override', description: `set your own video for "${signLabel}"` })
      toast.success('Your video is now used for your students')
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('admin_sign_teacher_overrides')
        .delete()
        .eq('admin_sign_id', adminSignId)
        .eq('teacher_id', user!.id)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'admin_sign.remove_override', description: `reverted to admin's video for "${signLabel}"` })
      toast.success("Reverted to admin's video")
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setVideoUrl(currentOverrideUrl ?? '') }}>
      <Button
        variant={currentOverrideUrl ? 'default' : 'outline'}
        size="sm"
        onClick={() => setOpen(true)}
        className={currentOverrideUrl ? 'gap-1.5 bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]' : 'gap-1.5'}
      >
        <Video className="h-3.5 w-3.5" />
        {currentOverrideUrl ? 'Using your video' : 'Use my own video'}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your video for &quot;{signLabel}&quot;</DialogTitle>
          <DialogDescription>
            Replace admin&apos;s video with your own, just for your students — used in Learn, Practice, and Quiz. Admin&apos;s original stays available as a variation in Learn mode.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="override-video">Video link (YouTube)</Label>
            <Input id="override-video" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            {videoUrl.trim() && (
              <p className={`text-xs ${parsedVideo?.embedUrl ? 'text-emerald-600' : 'text-amber-600'}`}>
                {parsedVideo?.embedUrl ? 'Recognized as YouTube link' : '⚠ Not a recognized YouTube link'}
              </p>
            )}
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            {currentOverrideUrl && (
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)} disabled={loading} className="text-red-600 hover:text-red-700">
                Revert to admin&apos;s video
              </Button>
            )}
            <Button type="submit" disabled={loading || !videoUrl.trim()} className="bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              {loading ? 'Saving…' : currentOverrideUrl ? 'Replace' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Revert to admin's video?"
        description={`Revert "${signLabel}" back to admin's original video for your students?`}
        confirmLabel="Revert"
        loading={loading}
        onConfirm={handleRemove}
      />
    </Dialog>
  )
}
