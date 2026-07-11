'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/email/templates'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export async function requestPasswordResetAction(email: string) {
  const admin = createAdminClient()
  const trimmedEmail = email.trim()

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
      options: { redirectTo: `${SITE_URL}/setup-password` },
    })
    if (!error) {
      await sendPasswordResetEmail(trimmedEmail, 'your account', data.properties.action_link)
    }
  } catch {
    // swallow — always return generic response below
  }

  return { message: 'If an account exists for that email, we\'ve sent a reset link.' }
}
