import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import ProgressRing from '@/components/student/ProgressRing'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: learnRows } = await supabase
    .from('learn_progress')
    .select('module_id, item_id')
    .eq('student_id', user!.id)

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('submodule_id, score, total, submitted_at')
    .eq('student_id', user!.id)
    .not('submitted_at', 'is', null)

  function moduleProgress(moduleId: string, totalItems: number): number {
    if (totalItems === 0) return 0
    const viewed = learnRows?.filter((r) => r.module_id === moduleId).length ?? 0
    return Math.round((viewed / totalItems) * 100)
  }

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div>
        <h1 className="text-2xl text-[#694B26] font-black">Progress</h1>
        <p className="text-sm text-muted-foreground">Your progress across all modules.</p>
      </div>

      <div>
        <div className="space-y-3">
          {MODULES.map((mod) => {
            const totalItems = mod.subModules.reduce((sum, sm) => sum + sm.items.length, 0)
            const percent = moduleProgress(mod.id, totalItems)
            return (
              <div key={mod.id} className="flex items-center gap-3 rounded-xl bg-[#ECE7DF] p-4 border border-[#DAD2C5]">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#694B26] font-bold truncate">{mod.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalItems > 0 ? `${Math.round((percent / 100) * totalItems)}/${totalItems} items viewed` : 'Coming soon'}
                  </p>
                </div>
                <ProgressRing percent={percent} size={44} strokeWidth={4} />
              </div>
            )
          })}
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
    </div>
  )
}
