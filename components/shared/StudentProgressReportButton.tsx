'use client'

import { useState } from 'react'
import { FileBarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { PickableModule } from '@/lib/queries/reportModules'
import ModuleMultiSelect from '@/components/shared/ModuleMultiSelect'
import { generateStudentProgressReportAction } from '@/app/actions/report'
import { downloadStudentProgressReportPdf } from '@/lib/downloadStudentProgressReportPdf'

interface Props {
  studentId: string
  studentName: string
  modules: PickableModule[]
}

export default function StudentProgressReportButton({ studentId, studentName, modules }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function openPicker() {
    setSelected(new Set())
    setOpen(true)
  }

  function toggle(moduleId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === modules.length ? new Set() : new Set(modules.map((m) => m.id))))
  }

  async function handleDownload() {
    setLoading(true)
    try {
      const data = await generateStudentProgressReportAction(studentId, [...selected])
      downloadStudentProgressReportPdf(studentName, data, `${studentName}-progress-report.pdf`)
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not generate the report right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={openPicker}>
        <FileBarChart className="h-4 w-4" /> Progress Report (PDF)
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
          <DialogHeader>
            <DialogTitle>{studentName} — Progress Report</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Choose which modules to include.</p>
          <ModuleMultiSelect modules={modules} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
          <DialogFooter>
            <Button onClick={handleDownload} disabled={selected.size === 0 || loading}>
              {loading ? 'Generating…' : 'Download PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
