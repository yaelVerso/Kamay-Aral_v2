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
  label?: string
  label_fil?: string
  description?: string
  video_url?: string
  image_url?: string
  accepted_answers?: string
}

interface RowError {
  row: number
  label: string
  reason: string
}

interface Props {
  submoduleId: string
  nextOrder: number
}

export default function SignsCsvImportDialog({ submoduleId, nextOrder }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: RowError[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setLoading(true)

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const valid: {
          label: string
          label_fil: string | null
          description: string | null
          video_url: string
          image_url: string | null
          accepted_answers: string[]
        }[] = []
        const errors: RowError[] = []

        results.data.forEach((row, idx) => {
          const rowNum = idx + 2 // +1 for header row, +1 for 1-indexing
          const label = row.label?.trim()
          const videoUrl = row.video_url?.trim()

          if (!label) {
            errors.push({ row: rowNum, label: '(blank)', reason: 'missing label' })
            return
          }
          if (!videoUrl) {
            errors.push({ row: rowNum, label, reason: 'missing video_url' })
            return
          }
          if (!parseVideoUrl(videoUrl).embedUrl) {
            errors.push({ row: rowNum, label, reason: 'video_url is not a recognized YouTube or Google Drive link' })
            return
          }

          const answers = (row.accepted_answers ?? '').split(';').map((a) => a.trim()).filter(Boolean)
          valid.push({
            label,
            label_fil: row.label_fil?.trim() || null,
            description: row.description?.trim() || null,
            video_url: videoUrl,
            image_url: row.image_url?.trim() || null,
            accepted_answers: answers.length > 0 ? answers : [label],
          })
        })

        if (valid.length > 0) {
          const supabase = createClient()
          const { error } = await supabase.from('custom_signs').insert(
            valid.map((v, i) => ({ ...v, submodule_id: submoduleId, order: nextOrder + i }))
          )
          if (error) {
            toast.error(`Import failed: ${error.message}`)
            setLoading(false)
            return
          }
          await recordAuditLog({ action: 'custom_sign.import', description: `imported ${valid.length} signs from CSV` })
          router.refresh()
        }

        setResult({ imported: valid.length, errors })
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
      error: (err) => {
        toast.error(`Failed to parse CSV: ${err.message}`)
        setLoading(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setResult(null) }}>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Signs from CSV</DialogTitle>
          <DialogDescription>
            Columns: label, label_fil, description, video_url, image_url, accepted_answers (semicolon-separated). label and video_url are required.
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

        {result && (
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              {result.imported} sign{result.imported === 1 ? '' : 's'} imported
              {result.errors.length > 0 && `, ${result.errors.length} row${result.errors.length === 1 ? '' : 's'} skipped`}
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/50 p-2">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">
                    Row {e.row} ({e.label}): {e.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {result ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
