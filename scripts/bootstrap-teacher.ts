/**
 * Test-only script to create a teacher account directly, bypassing
 * the email invite flow (useful while Resend isn't fully set up).
 * Run: npx tsx scripts/bootstrap-teacher.ts
 *
 * Edit the values below before running.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/supabase/admin'

const TEACHER_EMAIL = 'teacher01@example.com'
const TEACHER_PASSWORD = 'FilSignLangApp'
const TEACHER_FIRST_NAME = 'Teacher'
const TEACHER_LAST_NAME = 'One'
const TEACHER_ID_NUMBER = 'T-0001'

async function main() {
  const admin = createAdminClient()
  const fullName = `${TEACHER_FIRST_NAME} ${TEACHER_LAST_NAME}`.trim()

  // Note: role is intentionally omitted here. Setting role: 'teacher' at
  // creation time would fire the handle_teacher_signup trigger (schema.sql),
  // which auto-inserts into public.teachers itself — racing with our own
  // explicit insert below and causing a duplicate-key error on teachers_pkey.
  // Instead: create the auth user with no role, insert into teachers
  // ourselves, then set the role afterward — same order as
  // app/actions/admin.ts's createTeacherAction.
  const { data, error } = await admin.auth.admin.createUser({
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (error) {
    console.error('Failed to create teacher auth account:', error.message)
    process.exit(1)
  }

  const { error: teacherError } = await admin.from('teachers').insert({
    id: data.user.id,
    full_name: fullName,
    first_name: TEACHER_FIRST_NAME,
    last_name: TEACHER_LAST_NAME,
    id_number: TEACHER_ID_NUMBER,
  })

  if (teacherError) {
    console.error('Failed to create teachers row, rolling back auth user:', teacherError.message)
    await admin.auth.admin.deleteUser(data.user.id)
    process.exit(1)
  }

  await admin.auth.admin.updateUserById(data.user.id, { user_metadata: { role: 'teacher', full_name: fullName } })

  console.log('Teacher account created:', data.user.id, data.user.email)
}

main()
