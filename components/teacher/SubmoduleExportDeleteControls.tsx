'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Download, Trash2 } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'

const COLUMNS = ['label', 'label_fil', 'description', 'video_url', 'image_url', 'accepted_answers'] as const

interface Props {
  moduleId: string
  submoduleId: string
  submoduleTitle: string
}

export default function SubmoduleExportDeleteControls({ moduleId, submoduleId, submoduleTitle }: Props) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: signs } = await supabase
        .from('custom_signs')
        .select('label, label_fil, description, video_url, image_url, accepted_answers')
        .eq('submodule_id', submoduleId)
        .order('order')

      const rows = (signs ?? []).map((s) => ({
        label: s.label, label_fil: s.label_fil ?? '', description: s.description ?? '',
        video_url: s.video_url, image_url: s.image_url ?? '',
        accepted_answers: (s.accepted_answers ?? []).join(';'),
      }))

      const csv = Papa.unparse(rows, { columns: [...COLUMNS] })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${submoduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-signs.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExported(true)
      toast.success(`Exported ${rows.length} sign${rows.length === 1 ? '' : 's'}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('custom_submodules').delete().eq('id', submoduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_submodule.delete', description: `deleted sub-module "${submoduleTitle}"` })
      toast.success('Sub-module deleted')
      router.push(`/teacher/modules/${moduleId}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete sub-module')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={!exported}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Sub-module
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{submoduleTitle}&quot;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the sub-module and its signs. Make sure your CSV export finished downloading first — this can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Sub-module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
