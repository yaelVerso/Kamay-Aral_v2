import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import ProgressRing from '@/components/student/ProgressRing'
import ModuleAccordion from '@/components/shared/ModuleAccordion'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: learnRows }, { data: attempts }] = await Promise.all([
    supabase.from('learn_progress').select('module_id, item_id').eq('student_id', user!.id),
    supabase
      .from('quiz_attempts')
      .select('submodule_id, score, total, submitted_at')
      .eq('student_id', user!.id)
      .not('submitted_at', 'is', null),
  ])

  function moduleProgress(moduleId: string, totalItems: number): number {
    if (totalItems === 0) return 0
    const viewed = learnRows?.filter((r) => r.module_id === moduleId).length ?? 0
    return Math.round((viewed / totalItems) * 100)
  }

  function attemptFor(submoduleId: string) {
    return attempts?.find((a) => a.submodule_id === submoduleId)
  }

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div>
        <h1 className="text-2xl text-[#694B26] font-black">Progress</h1>
        <p className="text-sm text-muted-foreground">Your progress across all modules.</p>
      </div>

      <ModuleAccordion
        sections={MODULES.filter((mod) => mod.subModules.length > 0).map((mod) => {
          const totalItems = mod.subModules.reduce((sum, sm) => sum + sm.items.length, 0)
          const percent = moduleProgress(mod.id, totalItems)

          return {
            id: mod.id,
            title: mod.title,
            icon: mod.icon,
            badge: <ProgressRing percent={percent} size={36} strokeWidth={4} />,
            content: (
              <>
                {mod.subModules.map((sm) => {
                  const attempt = attemptFor(sm.id)
                  return (
                    <div key={sm.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
                      <p className="font-medium text-sm">{sm.title}</p>
                      {attempt ? (
                        <span className="text-sm font-bold text-[var(--brand-secondary)]">
                          {attempt.score}/{attempt.total}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No quiz taken yet</span>
                      )}
                    </div>
                  )
                })}
              </>
            ),
          }
        })}
      />
    </div>
  )
}
