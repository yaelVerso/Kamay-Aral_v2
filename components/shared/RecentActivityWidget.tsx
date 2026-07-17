import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface AuditLog {
  id: string
  actor_name: string
  actor_role: string
  description: string
  created_at: string
}

function roleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  if (role === 'admin') return 'default'
  if (role === 'teacher') return 'secondary'
  return 'outline'
}

const formatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export default function RecentActivityWidget({ logs, viewAllHref }: { logs: AuditLog[]; viewAllHref: string }) {
  return (
    <div className="flex h-full flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="font-semibold">Recent Activity</h2>
        <Link href={viewAllHref} className="text-sm text-indigo-600 hover:underline">
          View all →
        </Link>
      </div>

      {logs.length === 0 ? (
        <div className="mx-4 mb-4 rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
          No activity recorded yet.
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto px-4 pb-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {log.actor_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-medium text-sm">{log.actor_name}</p>
                    <Badge variant={roleBadgeVariant(log.actor_role)} className="capitalize">
                      {log.actor_role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {formatter.format(new Date(log.created_at))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
