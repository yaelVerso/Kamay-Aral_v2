import { MODULES } from '@/content/registry'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import ResetAttemptButton from '@/components/teacher/ResetAttemptButton'
import AttemptReview from '@/components/shared/AttemptReview'
import ModuleAccordion from '@/components/shared/ModuleAccordion'

interface Props {
  studentName: string
  sectionId?: string | null
  sectionName?: string | null
  learnProgress: { module_id: string; submodule_id: string; item_id: string }[]
  attempts: { id: string; submodule_id: string; score: number | null; total: number | null; submitted_at: string | null }[]
  answers: { attempt_id: string; item_id: string; activity_type: string; answer_given: string | null; is_correct: boolean }[]
}

export default function StudentProgressView({ studentName, sectionId, sectionName, learnProgress, attempts, answers }: Props) {
  function learnedCount(moduleId: string, submoduleId: string, totalItems: number) {
    const viewed = learnProgress.filter(
      (p) => p.module_id === moduleId && p.submodule_id === submoduleId
    ).length
    return `${viewed}/${totalItems}`
  }

  function getAttempt(submoduleId: string) {
    return attempts.find((a) => a.submodule_id === submoduleId)
  }

  function getItemAnalysis(attemptId: string) {
    return answers.filter((a) => a.attempt_id === attemptId)
  }

  /** Average of each attempted sub-module's percent score, skipping ones not yet taken. */
  function moduleAverage(moduleId: string, subModuleIds: string[]) {
    const percents = subModuleIds
      .map((smId) => getAttempt(smId))
      .filter((a): a is NonNullable<typeof a> => !!a?.submitted_at && !!a.total)
      .map((a) => (a.score ?? 0) / a.total! * 100)
    if (percents.length === 0) return null
    return Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-3">
        <h2 className="font-semibold">Performance</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Needs Review
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Needs Attention
          </span>
        </div>
      </div>
      <ModuleAccordion
      sections={MODULES.filter((mod) => mod.subModules.length > 0).map((mod) => {
        const avg = moduleAverage(mod.id, mod.subModules.map((sm) => sm.id))
        return {
        id: mod.id,
        title: mod.title,
        icon: mod.icon,
        badge: avg !== null ? (
          <span className={`text-xs font-bold ${avg >= 80 ? 'text-emerald-600' : avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {avg}% avg
          </span>
        ) : undefined,
        content: (
          <>
            {mod.subModules.map((sm) => {
              const attempt = getAttempt(sm.id)
              const submitted = !!attempt?.submitted_at
              const itemAnswers = attempt ? getItemAnalysis(attempt.id) : []
              const percent = attempt?.total
                ? Math.round((attempt.score ?? 0) / attempt.total * 100)
                : null

              return (
                <div key={sm.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{sm.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Learn: {learnedCount(mod.id, sm.id, sm.items.length)} items viewed
                      </p>
                    </div>
                    {submitted && percent !== null && (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          percent >= 80 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {attempt.score}/{attempt.total} ({percent}%)
                        </span>
                        <ResetAttemptButton
                          attemptId={attempt.id}
                          studentName={studentName}
                          submoduleTitle={sm.title}
                          sectionId={sectionId}
                          sectionName={sectionName}
                        />
                      </div>
                    )}
                    {attempt && !submitted && (
                      <span className="text-xs text-amber-600 font-medium">In progress</span>
                    )}
                  </div>

                  {submitted && itemAnswers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Item Analysis</p>
                      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                        {sm.items.map((item) => {
                          const results = itemAnswers.filter((a) => a.item_id === item.id)
                          const correctCount = results.filter((a) => a.is_correct).length
                          const ratio = results.length > 0 ? correctCount / results.length : null
                          // green/yellow/red by correct ratio
                          const status = ratio === null ? null : ratio === 1 ? 'correct' : ratio >= 0.5 ? 'partial' : 'wrong'
                          return (
                            <div
                              key={item.id}
                              title={`${item.label}: ${correctCount}/${results.length} correct`}
                              className={`flex items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-xs font-bold ${
                                status === 'correct' ? 'bg-emerald-100 text-emerald-700' :
                                status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                status === 'wrong' ? 'bg-red-100 text-red-700' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {item.label}
                              {status === 'correct' && <CheckCircle2 className="h-3 w-3" />}
                              {status === 'partial' && <AlertTriangle className="h-3 w-3" />}
                              {status === 'wrong' && <span>✗</span>}
                            </div>
                          )
                        })}
                      </div>
                      <AttemptReview answers={itemAnswers} items={sm.items} />
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ),
        }
      })}
      />
    </>
  )
}
