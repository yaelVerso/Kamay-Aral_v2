/**
 * One-time script to create the fixed admin account.
 * Run once: npx tsx scripts/bootstrap-admin.ts
 *
 * Edit the email/password below before running, then delete
 * the credentials from this file (or just don't commit them).
 * 
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/supabase/admin'

const ADMIN_EMAIL = 'admin01@example.com'
const ADMIN_PASSWORD = 'Filsignlangapp1'
const ADMIN_FULL_NAME = 'Admin01'

async function main() {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin', full_name: ADMIN_FULL_NAME },
  })

  if (error) {
    console.error('Failed to create admin account:', error.message)
    process.exit(1)
  }

  console.log('Admin account created:', data.user.id, data.user.email)
}

main()
