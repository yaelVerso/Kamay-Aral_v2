import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getModule } from '@/content/registry'
import Link from 'next/link'
import { ChevronLeft, Lock, CheckCircle2 } from 'lucide-react'

export default async function ModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const mod = getModule(moduleId)
  if (!mod) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch completed quiz attempts for this student
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('submodule_id, score, total')
    .eq('student_id', user!.id)
    .not('submitted_at', 'is', null)

  // Fetch student's section for quiz settings
  const { data: student } = await supabase
    .from('students')
    .select('section_id')
    .eq('id', user!.id)
    .single()

  const { data: quizSettings } = await supabase
    .from('quiz_settings')
    .select('submodule_id, enabled')
    .eq('section_id', student?.section_id ?? '')

  function isQuizEnabled(submoduleId: string) {
    return quizSettings?.find((q) => q.submodule_id === submoduleId)?.enabled ?? false
  }

  function quizAttempt(submoduleId: string) {
    return attempts?.find((a) => a.submodule_id === submoduleId)
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <Link href="/dashboard" className="mb-4 flex items-center gap-1 text-base text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="text-4xl">{mod.icon}</span>
        <div>
          <h1 className="text-2xl text-[#694B26] font-black">{mod.title}</h1>
          <p className="text-sm text-muted-foreground">{mod.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:px-20 lg:grid-cols-2 lg:gap-6">
        {mod.subModules.map((sm, idx) => {
          const attempt = quizAttempt(sm.id)
          const quizEnabled = isQuizEnabled(sm.id)

          return (
            <div key={sm.id} className="rounded-2xl bg-[#FDEFCA] shadow-[0_4px_0_#EFD385] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A5D5DA] text-xs font-bold text-[#007B89] mr-3">
                    {idx + 1}
                  </span>
                  <h2 className="text-2xl text-[#694B26] font-extrabold ">{sm.title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <Link
                    href={`/module/${moduleId}/${sm.id}/learn`}
                    className="flex flex-row items-center justify-center gap-1 rounded-xl bg-[#FCCF52] p-2 text-[#694B26] text-base font-bold hover:bg-[#FFC31E] active:scale-95 transition-transform"
                  >
                    <span className="text-lg">📖</span>
                    Learn
                  </Link>
                  <Link
                    href={`/module/${moduleId}/${sm.id}/activity`}
                    className="flex flex-row items-center justify-center gap-1 rounded-xl bg-[#FFA93C] p-2 text-white text-base font-bold hover:bg-[#FF9A1A] active:scale-95 transition-transform"
                  >
                    <span className="text-lg">🎮</span>
                    Practice
                  </Link>
                </div>

                <div className="mt-3">
                  {quizEnabled && !attempt ? (
                    <Link
                      href={`/module/${moduleId}/${sm.id}/quiz`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0BC2D7] p-3 text-white text-base font-bold active:scale-95 transition-transform"
                    >
                      <span>📝</span>
                      Take Quiz
                    </Link>
                  ) : attempt ? (
                    <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5 text-base">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-[#579F10]" />
                        Quiz completed
                      </div>
                      <span className="font-bold text-[#007B89]">{attempt.score}/{attempt.total}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-xl bg-[#CFC2B5] px-3 py-2.5 text-base text-white">
                      <Lock className="h-4 w-4" />
                      Quiz not available yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
