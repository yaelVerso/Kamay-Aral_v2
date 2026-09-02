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
  module_title?: string
  module_icon?: string
  module_description?: string
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
  modulesCreated: number
  submodulesCreated: number
  signsImported: number
  errors: RowError[]
}

export default function ModulesCsvImportDialog() {
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
          if (summary.modulesCreated + summary.submodulesCreated + summary.signsImported > 0) {
            await recordAuditLog({
              action: 'custom_module.import',
              description: `imported ${summary.modulesCreated} modules, ${summary.submodulesCreated} sub-modules, ${summary.signsImported} signs from CSV`,
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
    const { data: { user } } = await supabase.auth.getUser()
    const teacherId = user!.id

    const errors: RowError[] = []
    let modulesCreated = 0
    let submodulesCreated = 0
    let signsImported = 0

    // Pre-load what this teacher already owns, so re-importing an export
    // (or adding to an existing module) reuses rows instead of duplicating.
    const { data: existingModules } = await supabase
      .from('custom_modules')
      .select('id, title')
      .eq('teacher_id', teacherId)
    const moduleIdByTitle = new Map((existingModules ?? []).map((m) => [m.title.trim().toLowerCase(), m.id]))

    const existingModuleIds = [...moduleIdByTitle.values()]
    const { data: existingSubmodules } = existingModuleIds.length > 0
      ? await supabase.from('custom_submodules').select('id, module_id, title, order').in('module_id', existingModuleIds)
      : { data: [] }
    const submoduleIdByKey = new Map((existingSubmodules ?? []).map((s) => [`${s.module_id}::${s.title.trim().toLowerCase()}`, s.id]))
    const submoduleOrderCounter = new Map<string, number>()
    for (const s of existingSubmodules ?? []) {
      submoduleOrderCounter.set(s.module_id, Math.max(submoduleOrderCounter.get(s.module_id) ?? 0, s.order + 1))
    }
    const signOrderCounter = new Map<string, number>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      const moduleTitle = row.module_title?.trim()
      const submoduleTitle = row.submodule_title?.trim()
      const label = row.label?.trim()
      const videoUrl = row.video_url?.trim()

      if (!moduleTitle) { errors.push({ row: rowNum, reason: 'missing module_title' }); continue }
      if (!submoduleTitle) { errors.push({ row: rowNum, reason: 'missing submodule_title' }); continue }
      // a row may declare just a module/sub-module with no sign (label and video_url both blank)
      if (!label && !videoUrl) {
        // fall through to resolve module/sub-module only, no sign
      } else if (!label) {
        errors.push({ row: rowNum, reason: 'has video_url but missing label' }); continue
      } else if (!videoUrl) {
        errors.push({ row: rowNum, reason: 'has label but missing video_url' }); continue
      } else if (!parseVideoUrl(videoUrl).embedUrl) {
        errors.push({ row: rowNum, reason: 'video_url is not a recognized YouTube link' }); continue
      }

      const moduleKey = moduleTitle.toLowerCase()
      let moduleId = moduleIdByTitle.get(moduleKey)
      if (!moduleId) {
        const { data: newModule, error } = await supabase.from('custom_modules').insert({
          teacher_id: teacherId,
          title: moduleTitle,
          icon: row.module_icon?.trim() || '📚',
          description: row.module_description?.trim() || null,
        }).select('id').single()
        if (error || !newModule) { errors.push({ row: rowNum, reason: `failed to create module: ${error?.message}` }); continue }
        moduleId = newModule.id
        moduleIdByTitle.set(moduleKey, moduleId)
        modulesCreated++
      }

      const submoduleKey = `${moduleId}::${submoduleTitle.toLowerCase()}`
      let submoduleId = submoduleIdByKey.get(submoduleKey)
      if (!submoduleId) {
        const order = submoduleOrderCounter.get(moduleId) ?? 0
        const { data: newSubmodule, error } = await supabase.from('custom_submodules').insert({
          module_id: moduleId,
          title: submoduleTitle,
          short_title: row.submodule_short_title?.trim() || submoduleTitle,
          order,
        }).select('id').single()
        if (error || !newSubmodule) { errors.push({ row: rowNum, reason: `failed to create sub-module: ${error?.message}` }); continue }
        submoduleId = newSubmodule.id
        submoduleIdByKey.set(submoduleKey, submoduleId)
        submoduleOrderCounter.set(moduleId, order + 1)
        submodulesCreated++
      }

      if (!label || !videoUrl) continue // module/sub-module-only row, nothing more to insert

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

    return { modulesCreated, submodulesCreated, signsImported, errors }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSummary(null) }}>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Modules from CSV</DialogTitle>
          <DialogDescription>
            One row per sign. Columns: module_title, module_icon, module_description, submodule_title, submodule_short_title, label, label_fil, description, video_url, image_url, accepted_answers (semicolon-separated).
            A module or sub-module that already exists (matched by title) is reused instead of duplicated — you can list several modules in one file.
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
              {summary.modulesCreated} module{summary.modulesCreated === 1 ? '' : 's'}, {summary.submodulesCreated} sub-module{summary.submodulesCreated === 1 ? '' : 's'}, {summary.signsImported} sign{summary.signsImported === 1 ? '' : 's'} created
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
