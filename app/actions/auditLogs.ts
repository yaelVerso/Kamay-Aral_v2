'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordAuditLog } from '@/app/actions/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Not authorized')
  }
}

// full history for export, not the 200-row cap the audit logs page uses for display
export async function getAllAuditLogsAction() {
  await requireAdmin()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('audit_logs')
    .select('actor_name, actor_role, action, description, section_name, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// meant to run right after an export - wipes the table so it doesn't grow unbounded.
// the "cleared" row this leaves behind via recordAuditLog is deliberately the only one left
export async function clearAuditLogsAction() {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('audit_logs').delete().gte('created_at', '1970-01-01')
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'audit_logs.clear', description: 'exported and cleared audit logs' })
}
