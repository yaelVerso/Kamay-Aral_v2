'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { recordAuditLog } from '@/app/actions/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Not authorized')
  }
}

export async function updateBrandingAction(payload: {
  systemName: string
  primaryColor: string
  secondaryColor: string
}) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('app_settings')
    .update({
      system_name: payload.systemName.trim() || null,
      primary_color: payload.primaryColor.trim() || null,
      secondary_color: payload.secondaryColor.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', true)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'branding.update', description: 'updated system branding' })
}

export async function uploadBrandingLogoAction(formData: FormData) {
  await requireAdmin()
  const admin = createAdminClient()

  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) throw new Error('No file provided')

  const ext = file.name.split('.').pop() || 'png'
  const path = `logo-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('branding')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrl } = admin.storage.from('branding').getPublicUrl(path)

  const { error } = await admin
    .from('app_settings')
    .update({ logo_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'branding.update', description: 'updated system logo' })

  return publicUrl.publicUrl
}

export async function removeBrandingLogoAction() {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: current } = await admin.from('app_settings').select('logo_url').eq('id', true).single()

  const { error } = await admin
    .from('app_settings')
    .update({ logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) throw new Error(error.message)

  // best-effort file cleanup, don't fail the request if this errors
  if (current?.logo_url) {
    const path = current.logo_url.split('/branding/').pop()
    if (path) await admin.storage.from('branding').remove([path])
  }

  await recordAuditLog({ action: 'branding.update', description: 'removed system logo' })
}
