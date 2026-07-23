'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendTeacherInviteEmail, sendStudentInviteEmail } from '@/lib/email/templates'
import { recordAuditLog } from '@/app/actions/audit'

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
  idNumber: string
}) {
  await requireAdmin()

  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const idNumber = payload.idNumber.trim()

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
    .insert({ id: userId, full_name: fullName, first_name: firstName, last_name: lastName, id_number: idNumber })
  if (teacherError) {
    await admin.auth.admin.deleteUser(userId)
    if (teacherError.code === '23505') throw new Error('That ID number is already in use.')
    throw new Error(teacherError.message)
  }

  await admin.auth.admin.updateUserById(userId, { user_metadata: { role: 'teacher', full_name: fullName } })

  try {
    await sendTeacherInviteEmail(payload.email, fullName, linkData.properties.action_link)
  } catch {
    throw new Error('Account created but invite email failed to send. Use Resend Invite to try again.')
  }

  await recordAuditLog({ action: 'teacher.create', description: `created teacher account for ${fullName}` })
}

export async function createStudentAction(payload: {
  firstName: string
  lastName: string
  email: string
  idNumber: string
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
  const email = payload.email.trim()
  const idNumber = payload.idNumber.trim()

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
    email,
    id_number: idNumber,
  })
  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    if (studentError.code === '23505') throw new Error('That ID number is already in use.')
    throw new Error(studentError.message)
  }

  try {
    await sendStudentInviteEmail(email, fullName, linkData.properties.action_link)
  } catch {
    throw new Error('Account created but invite email failed to send. Use Resend Invite to try again.')
  }

  let description = `created student account for ${fullName}`
  let taggedSection: { id: string; name: string } | null = null
  if (payload.sectionId) {
    const { data: section } = await admin.from('sections').select('id, name').eq('id', payload.sectionId).single()
    if (section) {
      description += ` in section ${section.name}`
      taggedSection = section
    }
  }
  await recordAuditLog({
    action: 'student.create',
    description,
    sectionId: taggedSection?.id,
    sectionName: taggedSection?.name,
  })
}

// accounts are deactivated (banned), never deleted — deletion is manual, in Supabase directly

export async function deactivateTeacherAction(teacherId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: teacher } = await admin.from('teachers').select('full_name').eq('id', teacherId).single()

  const { error: banError } = await admin.auth.admin.updateUserById(teacherId, { ban_duration: '87600h' })
  if (banError) throw new Error(banError.message)
  const { error } = await admin.from('teachers').update({ is_active: false }).eq('id', teacherId)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'teacher.deactivate', description: `deactivated teacher account for ${teacher?.full_name ?? 'a teacher'}` })
}

export async function reactivateTeacherAction(teacherId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: teacher } = await admin.from('teachers').select('full_name').eq('id', teacherId).single()

  const { error: banError } = await admin.auth.admin.updateUserById(teacherId, { ban_duration: 'none' })
  if (banError) throw new Error(banError.message)
  const { error } = await admin.from('teachers').update({ is_active: true }).eq('id', teacherId)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'teacher.reactivate', description: `reactivated teacher account for ${teacher?.full_name ?? 'a teacher'}` })
}

export async function deactivateStudentAction(studentId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: student } = await admin.from('students').select('full_name').eq('id', studentId).single()

  const { error: banError } = await admin.auth.admin.updateUserById(studentId, { ban_duration: '87600h' })
  if (banError) throw new Error(banError.message)
  const { error } = await admin.from('students').update({ is_active: false }).eq('id', studentId)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'student.deactivate', description: `deactivated student account for ${student?.full_name ?? 'a student'}` })
}

export async function reactivateStudentAction(studentId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: student } = await admin.from('students').select('full_name').eq('id', studentId).single()

  const { error: banError } = await admin.auth.admin.updateUserById(studentId, { ban_duration: 'none' })
  if (banError) throw new Error(banError.message)
  const { error } = await admin.from('students').update({ is_active: true }).eq('id', studentId)
  if (error) throw new Error(error.message)

  await recordAuditLog({ action: 'student.reactivate', description: `reactivated student account for ${student?.full_name ?? 'a student'}` })
}

export async function updateTeacherAction(payload: {
  teacherId: string
  firstName: string
  lastName: string
  idNumber: string
  email: string
}) {
  await requireAdmin()
  const admin = createAdminClient()

  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const idNumber = payload.idNumber.trim()
  const email = payload.email.trim()

  const { error: authError } = await admin.auth.admin.updateUserById(payload.teacherId, {
    email,
    user_metadata: { role: 'teacher', full_name: fullName },
  })
  if (authError) throw new Error(authError.message)

  const { error } = await admin
    .from('teachers')
    .update({ full_name: fullName, first_name: firstName, last_name: lastName, id_number: idNumber })
    .eq('id', payload.teacherId)
  if (error) {
    if (error.code === '23505') throw new Error('That ID number is already in use.')
    throw new Error(error.message)
  }

  await recordAuditLog({ action: 'teacher.update', description: `updated teacher account for ${fullName}` })
}

export async function updateStudentAction(payload: {
  studentId: string
  firstName: string
  lastName: string
  idNumber: string
  email: string
  sectionId: string | null
}) {
  await requireAdmin()
  const admin = createAdminClient()

  const firstName = payload.firstName.trim()
  const lastName = payload.lastName.trim()
  const fullName = `${firstName} ${lastName}`.trim()
  const idNumber = payload.idNumber.trim()
  const email = payload.email.trim()

  const { error: authError } = await admin.auth.admin.updateUserById(payload.studentId, { email })
  if (authError) throw new Error(authError.message)

  const { error } = await admin
    .from('students')
    .update({ full_name: fullName, first_name: firstName, last_name: lastName, id_number: idNumber, email, section_id: payload.sectionId })
    .eq('id', payload.studentId)
  if (error) {
    if (error.code === '23505') throw new Error('That ID number is already in use.')
    throw new Error(error.message)
  }

  await recordAuditLog({ action: 'student.update', description: `updated student account for ${fullName}` })
}

export async function resendTeacherInviteAction(teacherId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: teacher } = await admin.from('teachers').select('full_name').eq('id', teacherId).single()
  const { data: authUser, error: userError } = await admin.auth.admin.getUserById(teacherId)
  if (userError || !authUser.user.email) throw new Error('Could not find that teacher\'s email address')

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: authUser.user.email,
    options: { redirectTo: `${SITE_URL}/setup-password?role=teacher` },
  })
  if (linkError) throw new Error(linkError.message)

  await sendTeacherInviteEmail(authUser.user.email, teacher?.full_name ?? 'there', linkData.properties.action_link)

  await recordAuditLog({ action: 'teacher.resend_invite', description: `resent invite for ${teacher?.full_name ?? 'a teacher'}` })
}

export async function resendStudentInviteAction(studentId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: student } = await admin.from('students').select('full_name, email').eq('id', studentId).single()
  if (!student?.email) throw new Error('That student has no email on file')

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: student.email,
    options: { redirectTo: `${SITE_URL}/setup-password?role=student` },
  })
  if (linkError) throw new Error(linkError.message)

  await sendStudentInviteEmail(student.email, student.full_name, linkData.properties.action_link)

  await recordAuditLog({ action: 'student.resend_invite', description: `resent invite for ${student.full_name}` })
}

export async function createSectionForTeacherAction(payload: { teacherId: string; name: string }) {
  await requireAdmin()
  const admin = createAdminClient()
  const name = payload.name.trim()

  const { data: newSection, error } = await admin
    .from('sections')
    .insert({ teacher_id: payload.teacherId, name })
    .select('id')
    .single()
  if (error) throw new Error(error.message)

  const { data: teacher } = await admin.from('teachers').select('full_name').eq('id', payload.teacherId).single()
  await recordAuditLog({
    action: 'section.create',
    description: `created section ${name} for ${teacher?.full_name ?? 'a teacher'}`,
    sectionId: newSection?.id,
    sectionName: name,
  })
}

export async function deleteSectionAction(sectionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'
  const client = isAdmin ? createAdminClient() : supabase

  const { data: section } = await client
    .from('sections')
    .select('id, name, teacher_id')
    .eq('id', sectionId)
    .single()
  if (!section) throw new Error('Section not found')
  if (!isAdmin && section.teacher_id !== user.id) throw new Error('Not authorized')

  const { error } = await client.from('sections').delete().eq('id', sectionId)
  if (error) throw new Error(error.message)

  await recordAuditLog({
    action: 'section.delete',
    description: `deleted section ${section.name}`,
    sectionId: section.id,
    sectionName: section.name,
  })
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

  const { data: before } = await client.from('students').select('full_name, section_id').eq('id', studentId).single()
  const { data: oldSection } = before?.section_id
    ? await client.from('sections').select('name').eq('id', before.section_id).single()
    : { data: null }

  const { error } = await client.from('students').update({ section_id: null }).eq('id', studentId)
  if (error) throw new Error(error.message)

  await recordAuditLog({
    action: 'student.remove_from_section',
    description: `removed ${before?.full_name ?? 'a student'} from section ${oldSection?.name ?? 'unknown'}`,
    sectionId: before?.section_id,
    sectionName: oldSection?.name,
  })
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
    .select('full_name, section_id')
    .eq('id', payload.studentId)
    .single()
  if (target?.section_id) throw new Error('Student is already assigned to a section')

  const { error } = await client
    .from('students')
    .update({ section_id: payload.sectionId })
    .eq('id', payload.studentId)
  if (error) throw new Error(error.message)

  const { data: section } = await client.from('sections').select('name').eq('id', payload.sectionId).single()
  await recordAuditLog({
    action: 'student.add_to_section',
    description: `added ${target?.full_name ?? 'a student'} to section ${section?.name ?? 'unknown'}`,
    sectionId: payload.sectionId,
    sectionName: section?.name,
  })
}
