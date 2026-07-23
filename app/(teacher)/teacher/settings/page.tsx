import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'
import FontSizeControl from '@/components/shared/FontSizeControl'

export default async function TeacherSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('full_name, id_number')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm font-medium">{teacher?.full_name ?? user?.user_metadata?.full_name ?? 'Teacher'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {teacher?.id_number && (
              <p className="text-sm text-muted-foreground">ID: {teacher.id_number}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personalization</CardTitle>
          </CardHeader>
          <CardContent>
            <FontSizeControl />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
