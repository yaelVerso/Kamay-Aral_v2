import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import Link from 'next/link'
import ProgressRing from '@/components/student/ProgressRing'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: student } = await supabase
    .from('students')
    .select('first_name, full_name')
    .eq('id', user!.id)
    .single()

  // Count viewed items per module for progress rings
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
    <div className="px-4 pt-8 pb-4">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl text-[#694B26] font-black">{student?.first_name ?? student?.full_name ?? 'Student'} 👋</h1>
      </div>

      <h2 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide">
        Modules
      </h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
        {MODULES.map((mod) => {
          const totalItems = mod.subModules.reduce((sum, sm) => sum + sm.items.length, 0)
          const percent = moduleProgress(mod.id, totalItems)
          const hasContent = mod.subModules.length > 0

          return (
            <Link
              key={mod.id}
              href={hasContent ? `/module/${mod.id}` : '#'}
              className={`relative flex flex-col gap-3 mt-1 rounded-2xl ${mod.color} p-4 transition-all active:scale-95 ${!hasContent ? 'opacity-50 pointer-events-none' : ''
                }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl lg:text-5xl">{mod.icon}</span>
                <ProgressRing percent={percent} size={52} strokeWidth={5} />
              </div>
              <div>
                <p className="lg:mt-10 font-extrabold text-white text-xl">{mod.title}</p>
                <p className="text-xs text-[#fafafabd] mt-0.5">
                  {hasContent ? `${mod.subModules.length} sections` : 'Coming soon'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}