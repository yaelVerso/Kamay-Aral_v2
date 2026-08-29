import { MODULES } from '@/content/registry'
import ModuleAccordion from '@/components/shared/ModuleAccordion'
import SubModuleAttemptCard from '@/components/shared/SubModuleAttemptCard'

interface AttemptRow {
  id: string
  submodule_id: string
  score: number | null
  total: number | null
  submitted_at: string | null
  started_at: string
  is_active: boolean
}

interface Props {
  studentName: string
  sectionId?: string | null
  sectionName?: string | null
  learnProgress: { module_id: string; submodule_id: string; item_id: string }[]
  attempts: AttemptRow[]
  answers: { attempt_id: string; item_id: string; activity_type: string; answer_given: string | null; is_correct: boolean }[]
}

export default function StudentProgressView({ studentName, sectionId, sectionName, learnProgress, attempts, answers }: Props) {
  function learnedCount(moduleId: string, submoduleId: string, totalItems: number) {
    const viewed = learnProgress.filter(
      (p) => p.module_id === moduleId && p.submodule_id === submoduleId
    ).length
    return `${viewed}/${totalItems}`
  }

  /** All attempts for a sub-module, oldest first (attempts prop is already ordered this way). */
  function getAttemptHistory(submoduleId: string) {
    return attempts.filter((a) => a.submodule_id === submoduleId)
  }

  /** The current (non-reset) attempt, used for scores/averages shown at a glance. */
  function getActiveAttempt(submoduleId: string) {
    return attempts.find((a) => a.submodule_id === submoduleId && a.is_active)
  }

  /** Average of each attempted sub-module's percent score, skipping ones not yet taken. */
  function moduleAverage(moduleId: string, subModuleIds: string[]) {
    const percents = subModuleIds
      .map((smId) => getActiveAttempt(smId))
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
            {mod.subModules.map((sm) => (
              <SubModuleAttemptCard
                key={sm.id}
                submodule={sm}
                learnedLabel={learnedCount(mod.id, sm.id, sm.items.length)}
                attempts={getAttemptHistory(sm.id)}
                answers={answers}
                studentName={studentName}
                sectionId={sectionId}
                sectionName={sectionName}
              />
            ))}
          </>
        ),
        }
      })}
      />
    </>
  )
}
