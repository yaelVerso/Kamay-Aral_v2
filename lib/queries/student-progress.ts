import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getStudentProgress(supabase: SupabaseServerClient, studentId: string) {
  const [{ data: learnProgress }, { data: attempts }] = await Promise.all([
    supabase
      .from('learn_progress')
      .select('module_id, submodule_id, item_id')
      .eq('student_id', studentId),
    supabase
      .from('quiz_attempts')
      .select('id, submodule_id, score, total, submitted_at')
      .eq('student_id', studentId),
  ])

  const attemptIds = attempts?.map((a) => a.id) ?? []
  const { data: answers } = attemptIds.length > 0
    ? await supabase
        .from('quiz_answers')
        .select('attempt_id, item_id, activity_type, answer_given, is_correct')
        .in('attempt_id', attemptIds)
    : { data: [] }

  return {
    learnProgress: learnProgress ?? [],
    attempts: attempts ?? [],
    answers: answers ?? [],
  }
}
