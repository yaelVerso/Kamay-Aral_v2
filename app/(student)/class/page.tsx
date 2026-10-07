import { createClient } from '@/lib/supabase/server'
import { getAssignedCustomModules } from '@/lib/queries/customContent'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import ProgressRing from '@/components/student/ProgressRing'
import { moduleColorStyle } from '@/lib/moduleColorStyle'

export default async function ClassPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [modules, { data: learnRows }] = await Promise.all([
    getAssignedCustomModules(supabase),
    supabase.from('learn_progress').select('module_id, item_id').eq('student_id', user!.id),
  ])

  function moduleProgress(moduleId: string, totalItems: number): number {
    if (totalItems === 0) return 0
    const viewed = learnRows?.filter((r) => r.module_id === moduleId).length ?? 0
    return Math.round((viewed / totalItems) * 100)
  }

  return (
    <div className="px-4 pt-8 pb-4">
      <div className="mb-6">
        <h1 className="text-3xl text-[#694B26] font-black">Class</h1>
        <p className="text-sm text-muted-foreground">Extra modules from your teacher.</p>
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <GraduationCap className="h-10 w-10" />
          <p>Your teacher hasn&apos;t assigned any modules to your class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
          {modules.map((mod) => {
            const totalItems = mod.subModules.reduce((sum, sm) => sum + sm.items.length, 0)
            const percent = moduleProgress(mod.id, totalItems)
            const hasContent = mod.subModules.length > 0
            const { className: colorClassName, style: colorStyle } = moduleColorStyle(mod.color)

            return (
              <Link
                key={mod.id}
                href={hasContent ? `/class/${mod.id}` : '#'}
                className={`relative flex flex-col mt-1 rounded-2xl ${colorClassName} p-3 md:p-4 transition-all active:scale-95 ${!hasContent ? 'opacity-50 pointer-events-none' : ''
                  }`}
                style={colorStyle}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl md:text-3xl lg:text-5xl">{mod.icon}</span>
                  <div className="md:hidden">
                    <ProgressRing percent={percent} size={36} strokeWidth={4} />
                  </div>
                  <div className="hidden md:block lg:hidden">
                    <ProgressRing percent={percent} size={44} strokeWidth={5} />
                  </div>
                  <div className="hidden lg:block">
                    <ProgressRing percent={percent} size={52} strokeWidth={5} />
                  </div>
                </div>
                <p className="mt-2 md:mt-4 lg:mt-10 font-extrabold text-white text-base md:text-lg lg:text-xl">{mod.title}</p>
                <p className="text-xs text-[#fafafabd] mt-auto pt-3">
                  {hasContent ? `${mod.subModules.length} sections` : 'Coming soon'}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
