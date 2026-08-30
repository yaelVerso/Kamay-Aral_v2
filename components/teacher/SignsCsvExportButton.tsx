'use client'

import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Sign {
  label: string
  label_fil: string | null
  description: string | null
  video_url: string
  image_url: string | null
  accepted_answers: string[]
}

interface Props {
  signs: Sign[]
  submoduleTitle: string
}

export default function SignsCsvExportButton({ signs, submoduleTitle }: Props) {
  function handleExport() {
    const rows = signs.map((s) => ({
      label: s.label,
      label_fil: s.label_fil ?? '',
      description: s.description ?? '',
      video_url: s.video_url,
      image_url: s.image_url ?? '',
      accepted_answers: (s.accepted_answers ?? []).join(';'),
    }))
    const csv = Papa.unparse(rows, { columns: ['label', 'label_fil', 'description', 'video_url', 'image_url', 'accepted_answers'] })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${submoduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-signs.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={signs.length === 0} className="gap-1.5">
      <Download className="h-4 w-4" />
      Export All
    </Button>
  )
}
