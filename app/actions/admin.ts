'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendTeacherInviteEmail, sendStudentInviteEmail } from '@/lib/email/templates'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Not authorized')
  }
  return { supabase, user }
}

export async function createTeacherAction(payload: {
  firstName: string
  lastName: string
  email: string
}) {
  await requireAdmin()

  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()

  const admin = createAdminClient()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: payload.email,
    options: { redirectTo: `${SITE_URL}/setup-password?role=teacher` },
  })
  if (linkError) throw new Error(linkError.message)

  const userId = linkData.user.id

  const { error: teacherError } = await admin
    .from('teachers')
    .insert({ id: userId, full_name: fullName, first_name: firstName, last_name: lastName })
  if (teacherError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(teacherError.message)
  }

  await admin.auth.admin.updateUserById(userId, { user_metadata: { role: 'teacher', full_name: fullName } })

  try {
    await sendTeacherInviteEmail(payload.email, fullName, linkData.properties.action_link)
  } catch {
    throw new Error('Account created but invite email failed to send. Use Resend Invite to try again.')
  }
}

export async function createStudentAction(payload: {
  firstName: string
  lastName: string
  username: string
  email: string
  sectionId?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'

  if (payload.sectionId) {
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('id', payload.sectionId)
      .eq('teacher_id', user.id)
      .single()
    if (!section && !isAdmin) throw new Error('Section not found or access denied')
  } else if (!isAdmin) {
    throw new Error('Not authorized')
  }

  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const username = payload.username.trim().toLowerCase()
  const email = payload.email.trim()

  const admin = createAdminClient()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo: `${SITE_URL}/setup-password?role=student` },
  })
  if (linkError) throw new Error(linkError.message)

  const userId = linkData.user.id

  const { error: studentError } = await admin.from('students').insert({
    id: userId,
    section_id: payload.sectionId ?? null,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    username,
    email,
  })
  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    throw new Error(studentError.message)
  }

  try {
    await sendStudentInviteEmail(email, fullName, username, linkData.properties.action_link)
  } catch {
    throw new Error('Account created but invite email failed to send. Use Resend Invite to try again.')
  }
}

export async function deleteTeacherAction(teacherId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(teacherId)
  if (error) throw new Error(error.message)
}

export async function deleteStudentAction(studentId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(studentId)
  if (error) throw new Error(error.message)
}

export async function createSectionForTeacherAction(payload: { teacherId: string; name: string }) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('sections')
    .insert({ teacher_id: payload.teacherId, name: payload.name.trim() })
  if (error) throw new Error(error.message)
}

export async function removeStudentFromSectionAction(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'

  if (!isAdmin) {
    const { data: student } = await supabase
      .from('students')
      .select('section_id')
      .eq('id', studentId)
      .single()
    if (!student?.section_id) throw new Error('Student is not assigned to a section')

    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('id', student.section_id)
      .eq('teacher_id', user.id)
      .single()
    if (!section) throw new Error('Not authorized')
  }

  const client = isAdmin ? createAdminClient() : supabase
  const { error } = await client.from('students').update({ section_id: null }).eq('id', studentId)
  if (error) throw new Error(error.message)
}

export async function addExistingStudentToSectionAction(payload: { studentId: string; sectionId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'

  if (!isAdmin) {
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('id', payload.sectionId)
      .eq('teacher_id', user.id)
      .single()
    if (!section) throw new Error('Section not found or access denied')
  }

  const client = isAdmin ? createAdminClient() : supabase

  const { data: target } = await client
    .from('students')
    .select('section_id')
    .eq('id', payload.studentId)
    .single()
  if (target?.section_id) throw new Error('Student is already assigned to a section')

  const { error } = await client
    .from('students')
    .update({ section_id: payload.sectionId })
    .eq('id', payload.studentId)
  if (error) throw new Error(error.message)
}
