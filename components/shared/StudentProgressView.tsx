import { MODULES } from '@/content/registry'
import { CheckCircle2 } from 'lucide-react'
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
      <h2 className="font-semibold mb-3">Performance</h2>
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
                <div key={sm.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
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
                          const allCorrect = results.length > 0 && results.every((a) => a.is_correct)
                          const anyWrong = results.some((a) => !a.is_correct)
                          return (
                            <div
                              key={item.id}
                              title={`${item.label}: ${results.filter((a) => a.is_correct).length}/${results.length} correct`}
                              className={`flex items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-xs font-bold ${
                                allCorrect ? 'bg-emerald-100 text-emerald-700' :
                                anyWrong ? 'bg-red-100 text-red-700' :
                                'bg-muted text-muted-foreground'
                              }`}
                            >
                              {item.label}
                              {allCorrect && <CheckCircle2 className="h-3 w-3" />}
                              {anyWrong && <span>✗</span>}
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
