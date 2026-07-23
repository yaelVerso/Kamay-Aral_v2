'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { getAllAuditLogsAction, clearAuditLogsAction } from '@/app/actions/auditLogs'

function toCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function downloadCsv(rows: { actor_name: string; actor_role: string; action: string; description: string; section_name: string | null; created_at: string }[]) {
  const header = ['Actor', 'Role', 'Action', 'Description', 'Section', 'Date']
  const lines = rows.map((r) =>
    [r.actor_name, r.actor_role, r.action, r.description, r.section_name ?? '', r.created_at].map(toCsvCell).join(','),
  )
  const csv = [header.map(toCsvCell).join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function AuditLogControls() {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const rows = await getAllAuditLogsAction()
      if (rows.length === 0) {
        toast.error('No logs to export')
        return
      }
      downloadCsv(rows)
      setExported(true)
      toast.success(`Exported ${rows.length} log${rows.length === 1 ? '' : 's'}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearAuditLogsAction()
      toast.success('Audit logs cleared')
      setClearOpen(false)
      setExported(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to clear logs')
    } finally {
      setClearing(false)
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
          onClick={() => setClearOpen(true)}
          disabled={!exported}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Clear Logs
        </Button>
      </div>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all audit logs?</DialogTitle>
            <DialogDescription>
              This permanently deletes every log entry from the database. Make sure your CSV export finished downloading first — this can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Clear Logs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
