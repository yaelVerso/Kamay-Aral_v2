import { createClient } from '@/lib/supabase/server'
import SettingsTabs from '@/components/admin/SettingsTabs'
import AuditLogList from '@/components/admin/AuditLogList'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // 200-row cap for v1 — server-side pagination is the follow-up if this grows.
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_name, actor_role, description, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">System configuration and activity history.</p>
      </div>

      <SettingsTabs
        tabs={[
          {
            id: 'audit-logs',
            label: 'Audit Logs',
            content: <AuditLogList logs={logs ?? []} />,
          },
        ]}
      />
    </div>
  )
}
