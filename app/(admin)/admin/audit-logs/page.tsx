import { createClient } from '@/lib/supabase/server'
import AuditLogList from '@/components/admin/AuditLogList'
import AuditLogControls from '@/components/admin/AuditLogControls'

export default async function AdminAuditLogsPage() {
  const supabase = await createClient()

  // 200-row cap for v1 — server-side pagination is the follow-up if this grows.
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_id, actor_name, actor_role, description, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  // audit_logs has no id_number of its own — look actors up in teachers/students by actor_id
  const [{ data: teachers }, { data: students }] = await Promise.all([
    supabase.from('teachers').select('id, id_number'),
    supabase.from('students').select('id, id_number'),
  ])

  function actorIdNumber(actorId: string | null, actorRole: string) {
    if (!actorId) return null
    const table = actorRole === 'teacher' ? teachers : actorRole === 'student' ? students : null
    return table?.find((row) => row.id === actorId)?.id_number ?? null
  }

  const logList = (logs ?? []).map((log) => ({
    ...log,
    actorIdNumber: actorIdNumber(log.actor_id, log.actor_role),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Activity history across all teachers, students, and admins.</p>
        </div>
        <AuditLogControls />
      </div>

      <AuditLogList logs={logList} />
    </div>
  )
}
