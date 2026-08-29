import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubModule, getModule } from '@/content/registry'
import QuizGate from '@/components/quiz/QuizGate'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function QuizPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const mod = getModule(moduleId)
  const submodule = getSubModule(moduleId, submoduleId)
  if (!mod || !submodule) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('section_id')
    .eq('id', user.id)
    .single()

  if (!student || !student.section_id) redirect('/dashboard')

  // Check quiz enabled
  const { data: setting } = await supabase
    .from('quiz_settings')
    .select('enabled')
    .eq('section_id', student.section_id)
    .eq('submodule_id', submodule.id)
    .single()

  if (!setting?.enabled) redirect(`/module/${moduleId}/${submoduleId}`)

  // Check existing active attempt (a reset deactivates the old one,
  // so this only ever sees the current try, not past history)
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('id, submitted_at')
    .eq('student_id', user.id)
    .eq('submodule_id', submodule.id)
    .eq('is_active', true)
    .maybeSingle()

  // Already submitted → redirect back
  if (existing?.submitted_at) redirect(`/module/${moduleId}/${submoduleId}`)

  // Create attempt if none exists
  let attemptId = existing?.id
  if (!attemptId) {
    const { data: newAttempt } = await supabase
      .from('quiz_attempts')
      .insert({ student_id: user.id, submodule_id: submodule.id })
      .select('id')
      .single()
    attemptId = newAttempt?.id
  }

  if (!attemptId) redirect(`/module/${moduleId}/${submoduleId}`)

  return <QuizGate module={mod} submodule={submodule} attemptId={attemptId} />
}
