/**
 * Test-only script to create a student account directly, bypassing
 * the email invite flow.
 * Run: npx tsx scripts/bootstrap-student.ts
 *
 * Edit the values below before running.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/supabase/admin'

const STUDENT_EMAIL = 'student01@example.com'
const STUDENT_PASSWORD = 'FilSignLangApp'
const STUDENT_FIRST_NAME = 'Student'
const STUDENT_LAST_NAME = 'One'
const STUDENT_ID_NUMBER = 'S-0001'
// Optional: paste a section UUID here to assign the student immediately,
// or leave null to create them unassigned (same as admin-created students).
const STUDENT_SECTION_ID: string | null = null

async function main() {
  const admin = createAdminClient()
  const fullName = `${STUDENT_FIRST_NAME} ${STUDENT_LAST_NAME}`.trim()

  const { data, error } = await admin.auth.admin.createUser({
    email: STUDENT_EMAIL,
    password: STUDENT_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    console.error('Failed to create student auth account:', error.message)
    process.exit(1)
  }

  const { error: studentError } = await admin.from('students').insert({
    id: data.user.id,
    section_id: STUDENT_SECTION_ID,
    full_name: fullName,
    first_name: STUDENT_FIRST_NAME,
    last_name: STUDENT_LAST_NAME,
    email: STUDENT_EMAIL,
    id_number: STUDENT_ID_NUMBER,
  })

  if (studentError) {
    console.error('Failed to create students row, rolling back auth user:', studentError.message)
    await admin.auth.admin.deleteUser(data.user.id)
    process.exit(1)
  }

  console.log('Student account created:', data.user.id, data.user.email)
}

main()
