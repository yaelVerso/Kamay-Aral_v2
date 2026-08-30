'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

const COLUMNS = [
  'module_title', 'module_icon', 'module_description',
  'submodule_title', 'submodule_short_title',
  'label', 'label_fil', 'description', 'video_url', 'image_url', 'accepted_answers',
] as const

export default function ModulesCsvExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: modules } = await supabase
        .from('custom_modules')
        .select('id, title, icon, description')
        .eq('teacher_id', user!.id)
        .order('created_at')

      if (!modules || modules.length === 0) {
        toast.error('No modules to export yet')
        return
      }

      const moduleIds = modules.map((m) => m.id)
      const { data: submodules } = await supabase
        .from('custom_submodules')
        .select('id, module_id, title, short_title, order')
        .in('module_id', moduleIds)
        .order('order')

      const submoduleIds = (submodules ?? []).map((s) => s.id)
      const { data: signs } = submoduleIds.length > 0
        ? await supabase
            .from('custom_signs')
            .select('submodule_id, label, label_fil, description, video_url, image_url, accepted_answers, order')
            .in('submodule_id', submoduleIds)
            .order('order')
        : { data: [] }

      const rows: Record<(typeof COLUMNS)[number], string>[] = []

      for (const mod of modules) {
        const modSubmodules = (submodules ?? []).filter((s) => s.module_id === mod.id)
        for (const sm of modSubmodules) {
          const smSigns = (signs ?? []).filter((s) => s.submodule_id === sm.id)
          if (smSigns.length === 0) {
            // still emit a row so the module/sub-module survives a round-trip even with no signs yet
            rows.push({
              module_title: mod.title, module_icon: mod.icon, module_description: mod.description ?? '',
              submodule_title: sm.title, submodule_short_title: sm.short_title,
              label: '', label_fil: '', description: '', video_url: '', image_url: '', accepted_answers: '',
            })
            continue
          }
          for (const sign of smSigns) {
            rows.push({
              module_title: mod.title, module_icon: mod.icon, module_description: mod.description ?? '',
              submodule_title: sm.title, submodule_short_title: sm.short_title,
              label: sign.label, label_fil: sign.label_fil ?? '', description: sign.description ?? '',
              video_url: sign.video_url, image_url: sign.image_url ?? '',
              accepted_answers: (sign.accepted_answers ?? []).join(';'),
            })
          }
        }
      }

      const csv = Papa.unparse(rows, { columns: [...COLUMNS] })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'my-modules.csv'
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
