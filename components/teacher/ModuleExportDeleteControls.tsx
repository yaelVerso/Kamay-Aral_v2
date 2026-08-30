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

// Includes module_title/icon/description (unlike ModuleContentCsvExportButton's
// "Export All") so this file is a standalone copy of the module — droppable
// straight into the Manage Modules page's Import to recreate it elsewhere,
// not just content to add back into this same already-existing module.
const COLUMNS = [
  'module_title', 'module_icon', 'module_description',
  'submodule_title', 'submodule_short_title',
  'label', 'label_fil', 'description', 'video_url', 'image_url', 'accepted_answers',
] as const

interface Props {
  moduleId: string
  moduleTitle: string
  moduleIcon: string
  moduleDescription: string | null
}

export default function ModuleExportDeleteControls({ moduleId, moduleTitle, moduleIcon, moduleDescription }: Props) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: submodules } = await supabase
        .from('custom_submodules')
        .select('id, title, short_title, order')
        .eq('module_id', moduleId)
        .order('order')

      const submoduleIds = (submodules ?? []).map((s) => s.id)
      const { data: signs } = submoduleIds.length > 0
        ? await supabase
            .from('custom_signs')
            .select('submodule_id, label, label_fil, description, video_url, image_url, accepted_answers, order')
            .in('submodule_id', submoduleIds)
            .order('order')
        : { data: [] }

      const moduleFields = { module_title: moduleTitle, module_icon: moduleIcon, module_description: moduleDescription ?? '' }

      const rows: Record<(typeof COLUMNS)[number], string>[] = []
      if (!submodules || submodules.length === 0) {
        // still emit a row so an empty module survives export→import as a module with no content yet
        rows.push({ ...moduleFields, submodule_title: '', submodule_short_title: '', label: '', label_fil: '', description: '', video_url: '', image_url: '', accepted_answers: '' })
      }
      for (const sm of submodules ?? []) {
        const smSigns = (signs ?? []).filter((s) => s.submodule_id === sm.id)
        if (smSigns.length === 0) {
          rows.push({ ...moduleFields, submodule_title: sm.title, submodule_short_title: sm.short_title, label: '', label_fil: '', description: '', video_url: '', image_url: '', accepted_answers: '' })
          continue
        }
        for (const sign of smSigns) {
          rows.push({
            ...moduleFields,
            submodule_title: sm.title, submodule_short_title: sm.short_title,
            label: sign.label, label_fil: sign.label_fil ?? '', description: sign.description ?? '',
            video_url: sign.video_url, image_url: sign.image_url ?? '',
            accepted_answers: (sign.accepted_answers ?? []).join(';'),
          })
        }
      }

      const csv = Papa.unparse(rows, { columns: [...COLUMNS] })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExported(true)
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`)
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
      const { error } = await supabase.from('custom_modules').delete().eq('id', moduleId)
      if (error) throw new Error(error.message)
      await recordAuditLog({ action: 'custom_module.delete', description: `deleted module "${moduleTitle}"` })
      toast.success('Module deleted')
      router.push('/teacher/modules')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete module')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export Module'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={!exported}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete Module
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{moduleTitle}&quot;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the module and its sub-modules and signs. Make sure your CSV export finished downloading first — this can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Module'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
