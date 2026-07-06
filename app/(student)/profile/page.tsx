import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/shared/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: student } = await supabase
    .from('students')
    .select('full_name, created_at')
    .eq('id', user!.id)
    .single()

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('submodule_id, score, total, submitted_at')
    .eq('student_id', user!.id)
    .not('submitted_at', 'is', null)

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
          {student?.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{student?.full_name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {attempts && attempts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Completed Quizzes
          </h2>
          <div className="space-y-2">
            {attempts.map((a) => (
              <div key={a.submodule_id} className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm">
                <p className="text-sm font-medium">{a.submodule_id}</p>
                <span className="text-sm font-bold text-indigo-600">
                  {a.score}/{a.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <LogoutButton />
    </div>
  )
}
