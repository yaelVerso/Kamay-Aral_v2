'use client'

import { useState } from 'react'
import { Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { PickableModule } from '@/lib/queries/reportModules'
import ModuleMultiSelect from '@/components/shared/ModuleMultiSelect'
import { generateReportAction } from '@/app/actions/report'
import { downloadReportPdf } from '@/lib/downloadReportPdf'

interface Props {
  studentId: string
  studentName: string
  sectionName: string | null
  modules: PickableModule[]
}

export default function GenerateReportButton({ studentId, studentName, sectionName, modules }: Props) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<'picker' | 'loading' | 'result'>('picker')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function openPicker() {
    setSelected(new Set())
    setPhase('picker')
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

  function handleDownload() {
    if (!report) return
    downloadReportPdf(`${studentName} — Progress Report`, report, `${studentName}-progress-report.pdf`, sectionName)
  }

  async function handleGenerate() {
    setPhase('loading')
    setError(null)
    setReport(null)
    try {
      setReport(await generateReportAction(studentId, [...selected]))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not generate the report right now.')
    } finally {
      setPhase('result')
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={openPicker}>
        <Sparkles className="h-4 w-4" /> Generate Report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
          <DialogHeader>
            <DialogTitle>{studentName} — Progress Report</DialogTitle>
            {sectionName && <p className="text-sm text-muted-foreground">{sectionName}</p>}
          </DialogHeader>

          {phase === 'picker' && (
            <>
              <p className="text-sm text-muted-foreground">Choose which modules to include.</p>
              <ModuleMultiSelect modules={modules} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
              <DialogFooter>
                <Button onClick={handleGenerate} disabled={selected.size === 0}>Generate</Button>
              </DialogFooter>
            </>
          )}

          {phase !== 'picker' && (
            <>
              <div className="flex-1 overflow-y-auto">
                {phase === 'loading' && <p className="py-6 text-center text-sm text-muted-foreground">Generating…</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {report && <div className="whitespace-pre-wrap text-sm">{report}</div>}
              </div>
              {report && (
                <DialogFooter>
                  <Button variant="outline" className="gap-1.5" onClick={handleDownload}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
