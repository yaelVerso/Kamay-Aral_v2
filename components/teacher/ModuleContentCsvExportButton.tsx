'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

const COLUMNS = [
  'submodule_title', 'submodule_short_title',
  'label', 'label_fil', 'description', 'video_url', 'image_url', 'accepted_answers',
] as const

interface Props {
  moduleId: string
  moduleTitle: string
}

export default function ModuleContentCsvExportButton({ moduleId, moduleTitle }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: submodules } = await supabase
        .from('custom_submodules')
        .select('id, title, short_title, order')
        .eq('module_id', moduleId)
        .order('order')

      if (!submodules || submodules.length === 0) {
        toast.error('No sub-modules to export yet')
        return
      }

      const submoduleIds = submodules.map((s) => s.id)
      const { data: signs } = await supabase
        .from('custom_signs')
        .select('submodule_id, label, label_fil, description, video_url, image_url, accepted_answers, order')
        .in('submodule_id', submoduleIds)
        .order('order')

      const rows: Record<(typeof COLUMNS)[number], string>[] = []
      for (const sm of submodules) {
        const smSigns = (signs ?? []).filter((s) => s.submodule_id === sm.id)
        if (smSigns.length === 0) {
          rows.push({
            submodule_title: sm.title, submodule_short_title: sm.short_title,
            label: '', label_fil: '', description: '', video_url: '', image_url: '', accepted_answers: '',
          })
          continue
        }
        for (const sign of smSigns) {
          rows.push({
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading} className="gap-1.5">
      <Download className="h-4 w-4" />
      {loading ? 'Exporting…' : 'Export All'}
    </Button>
  )
}
