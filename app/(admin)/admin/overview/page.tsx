import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RecentActivityWidget from '@/components/shared/RecentActivityWidget'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [{ count: teacherCount }, { count: sectionCount }, { count: studentCount }, { data: recentLogs }] = await Promise.all([
    supabase.from('teachers').select('id', { count: 'exact', head: true }),
    supabase.from('sections').select('id', { count: 'exact', head: true }),
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase
      .from('audit_logs')
      .select('id, actor_name, actor_role, description, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">System-wide stats across all teachers and students.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{teacherCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sectionCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{MODULES.length}</p>
          </CardContent>
        </Card>
      </div>

      <RecentActivityWidget logs={recentLogs ?? []} viewAllHref="/admin/audit-logs" />
    </div>
  )
}
