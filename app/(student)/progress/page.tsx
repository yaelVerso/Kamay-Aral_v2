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

  function moduleProgress(moduleId: string, totalItems: number): number {
    if (totalItems === 0) return 0
    const viewed = learnRows?.filter((r) => r.module_id === moduleId).length ?? 0
    return Math.round((viewed / totalItems) * 100)
  }

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-sm text-muted-foreground">Your progress across all modules.</p>
      </div>

      <div>
        <div className="space-y-3">
          {MODULES.map((mod) => {
            const totalItems = mod.subModules.reduce((sum, sm) => sum + sm.items.length, 0)
            const percent = moduleProgress(mod.id, totalItems)
            return (
              <div key={mod.id} className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mod.title}</p>
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
    </div>
  )
}
