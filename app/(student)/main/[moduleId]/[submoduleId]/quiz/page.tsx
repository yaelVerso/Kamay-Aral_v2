import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminModuleTree, getTeacherIdForStudent } from '@/lib/queries/adminContent'
import QuizGate from '@/components/quiz/QuizGate'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function MainQuizPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const teacherId = await getTeacherIdForStudent(supabase, user.id)
  const mod = await getAdminModuleTree(supabase, moduleId, teacherId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()
  if (submodule.items.length < 3) redirect(`/main/${moduleId}`)

  const { data: student } = await supabase
    .from('students')
    .select('section_id')
    .eq('id', user.id)
    .single()

  if (!student || !student.section_id) redirect('/dashboard')

  const { data: setting } = await supabase
    .from('quiz_settings')
    .select('enabled')
    .eq('section_id', student.section_id)
    .eq('submodule_id', submodule.id)
    .single()

  if (!setting?.enabled) redirect(`/main/${moduleId}`)

  // Check existing active attempt (a reset deactivates the old one,
  // so this only ever sees the current try, not past history)
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('id, submitted_at')
    .eq('student_id', user.id)
    .eq('submodule_id', submodule.id)
    .eq('is_active', true)
    .maybeSingle()

  if (existing?.submitted_at) redirect(`/main/${moduleId}`)

  let attemptId = existing?.id
  if (!attemptId) {
    const { data: newAttempt } = await supabase
      .from('quiz_attempts')
      .insert({ student_id: user.id, submodule_id: submodule.id })
      .select('id')
      .single()
    attemptId = newAttempt?.id
  }

  if (!attemptId) redirect(`/main/${moduleId}`)

  return (
    <QuizGate
      module={mod}
      submodule={submodule}
      attemptId={attemptId}
      backHref={`/main/${moduleId}`}
    />
  )
}
