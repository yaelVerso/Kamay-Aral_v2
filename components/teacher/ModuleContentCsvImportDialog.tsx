'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
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
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { recordAuditLog } from '@/app/actions/audit'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface CsvRow {
  submodule_title?: string
  submodule_short_title?: string
  label?: string
  label_fil?: string
  description?: string
  video_url?: string
  image_url?: string
  accepted_answers?: string
}

interface RowError {
  row: number
  reason: string
}

interface Summary {
  submodulesCreated: number
  signsImported: number
  errors: RowError[]
}

interface Props {
  moduleId: string
}

export default function ModuleContentCsvImportDialog({ moduleId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSummary(null)
    setLoading(true)

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const summary = await importRows(results.data)
          setSummary(summary)
          if (summary.submodulesCreated + summary.signsImported > 0) {
            await recordAuditLog({
              action: 'custom_module.import_content',
              description: `imported ${summary.submodulesCreated} sub-modules, ${summary.signsImported} signs from CSV`,
            })
            router.refresh()
          }
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Import failed')
        } finally {
          setLoading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (err) => {
        toast.error(`Failed to parse CSV: ${err.message}`)
        setLoading(false)
      },
    })
  }

  async function importRows(rows: CsvRow[]): Promise<Summary> {
    const supabase = createClient()
    const errors: RowError[] = []
    let submodulesCreated = 0
    let signsImported = 0

    const { data: existingSubmodules } = await supabase
      .from('custom_submodules')
      .select('id, title, order')
      .eq('module_id', moduleId)
    const submoduleIdByTitle = new Map((existingSubmodules ?? []).map((s) => [s.title.trim().toLowerCase(), s.id]))
    let nextSubmoduleOrder = Math.max(0, ...(existingSubmodules ?? []).map((s) => s.order + 1))
    const signOrderCounter = new Map<string, number>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      const submoduleTitle = row.submodule_title?.trim()
      const label = row.label?.trim()
      const videoUrl = row.video_url?.trim()

      if (!submoduleTitle) { errors.push({ row: rowNum, reason: 'missing submodule_title' }); continue }
      if (!label && !videoUrl) {
        // module/sub-module-only row, no sign
      } else if (!label) {
        errors.push({ row: rowNum, reason: 'has video_url but missing label' }); continue
      } else if (!videoUrl) {
        errors.push({ row: rowNum, reason: 'has label but missing video_url' }); continue
      } else if (!parseVideoUrl(videoUrl).embedUrl) {
        errors.push({ row: rowNum, reason: 'video_url is not a recognized YouTube link' }); continue
      }

      const submoduleKey = submoduleTitle.toLowerCase()
      let submoduleId = submoduleIdByTitle.get(submoduleKey)
      if (!submoduleId) {
        const { data: newSubmodule, error } = await supabase.from('custom_submodules').insert({
          module_id: moduleId,
          title: submoduleTitle,
          short_title: row.submodule_short_title?.trim() || submoduleTitle,
          order: nextSubmoduleOrder,
        }).select('id').single()
        if (error || !newSubmodule) { errors.push({ row: rowNum, reason: `failed to create sub-module: ${error?.message}` }); continue }
        submoduleId = newSubmodule.id
        submoduleIdByTitle.set(submoduleKey, submoduleId)
        nextSubmoduleOrder++
        submodulesCreated++
      }

      if (!label || !videoUrl) continue

      const answers = (row.accepted_answers ?? '').split(';').map((a) => a.trim()).filter(Boolean)
      const order = signOrderCounter.get(submoduleId) ?? 0
      const { error: signError } = await supabase.from('custom_signs').insert({
        submodule_id: submoduleId,
        label,
        label_fil: row.label_fil?.trim() || null,
        description: row.description?.trim() || null,
        video_url: videoUrl,
        image_url: row.image_url?.trim() || null,
        accepted_answers: answers.length > 0 ? answers : [label],
        order,
      })
      if (signError) { errors.push({ row: rowNum, reason: `failed to create sign: ${signError.message}` }); continue }
      signOrderCounter.set(submoduleId, order + 1)
      signsImported++
    }

    return { submodulesCreated, signsImported, errors }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSummary(null) }}>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import into this Module</DialogTitle>
          <DialogDescription>
            One row per sign. Columns: submodule_title, submodule_short_title, label, label_fil, description, video_url, image_url, accepted_answers (semicolon-separated).
            A sub-module that already exists in this module (matched by title) is reused instead of duplicated.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={loading}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
        />

        {loading && <p className="text-sm text-muted-foreground">Importing…</p>}

        {summary && (
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              {summary.submodulesCreated} sub-module{summary.submodulesCreated === 1 ? '' : 's'}, {summary.signsImported} sign{summary.signsImported === 1 ? '' : 's'} created
              {summary.errors.length > 0 && ` · ${summary.errors.length} row${summary.errors.length === 1 ? '' : 's'} skipped`}
            </p>
            {summary.errors.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/50 p-2">
                {summary.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">Row {e.row}: {e.reason}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {summary ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
