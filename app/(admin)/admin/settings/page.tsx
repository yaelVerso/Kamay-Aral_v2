import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'
import FontSizeControl from '@/components/shared/FontSizeControl'
import BrandingSettingsForm from '@/components/admin/BrandingSettingsForm'
import { getBranding } from '@/lib/queries/branding'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const branding = await getBranding()

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
            <p className="text-sm font-medium">{user?.user_metadata?.full_name ?? 'Admin'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Site Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <BrandingSettingsForm
              systemName={branding.systemName}
              logoUrl={branding.logoUrl}
              primaryColor={branding.primaryColor ?? '#007B89'}
              secondaryColor={branding.secondaryColor ?? '#4f46e5'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
