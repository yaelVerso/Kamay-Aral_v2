'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { recordAuditLog } from '@/app/actions/audit'

// Every save bumps the version, which is exactly what re-triggers the
// acceptance gate for students who already agreed to an older version —
// there's no separate "republish" step.
export async function updateLegalDocumentAction(content: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') return { error: 'Not authorized' }

  const admin = createAdminClient()

  const { data: current, error: readError } = await admin.from('legal_documents').select('version').eq('id', true).single()
  if (readError) return { error: readError.message }
  const nextVersion = (current?.version ?? 0) + 1

  const { error } = await admin
    .from('legal_documents')
    .update({ content, version: nextVersion, updated_at: new Date().toISOString() })
    .eq('id', true)
  if (error) return { error: error.message }

  await recordAuditLog({ action: 'legal.update', description: `updated Terms & Privacy (now version ${nextVersion})` })
  return {}
}
