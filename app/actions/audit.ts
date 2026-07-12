'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Records an audit-log entry for the currently authenticated user.
 * Actor identity (id, role, name) is always derived server-side from the
 * session — a caller can only supply the action/description text for their
 * own action, never impersonate another user's identity in the log.
 *
 * Never throws: a failed log write must never break the feature it's
 * attached to (account creation, quiz submission, etc).
 */
export async function recordAuditLog(payload: { action: string; description: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const role = (user.user_metadata?.role as string | undefined) ?? 'student'
    let actorName = user.user_metadata?.full_name as string | undefined

    const admin = createAdminClient()

    if (!actorName) {
      // Teachers get full_name in their metadata at creation; students
      // currently don't, so fall back to a table lookup for either role.
      const table = role === 'teacher' ? 'teachers' : 'students'
      const { data } = await admin.from(table).select('full_name').eq('id', user.id).single()
      actorName = data?.full_name ?? 'Unknown'
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_name: actorName,
      actor_role: role,
      action: payload.action,
      description: payload.description,
    })
  } catch {
    // Swallow — logging must never surface an error to the caller.
  }
}
