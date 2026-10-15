import QuizToggle from '@/components/teacher/QuizToggle'

interface Section {
  id: string
  name: string
}

interface Props {
  submoduleId: string
  submoduleTitle: string
  sections: Section[]
  enabledSectionIds: string[]
  itemCount: number
}

const MIN_QUIZ_ITEMS = 3

/**
 * Module-centric quiz control — lives on a sub-module's page in Modules
 * Management (both admin and custom), mirroring AssignModuleSections'
 * pattern. This is the only place quiz_settings is changed from — the
 * section page no longer shows a duplicate read-only summary of it.
 */
export default function QuizSectionAssignment({ submoduleId, submoduleTitle, sections, enabledSectionIds, itemCount }: Props) {
  const belowMinimum = itemCount < MIN_QUIZ_ITEMS

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="font-semibold mb-1">Quiz Settings</h2>
        <p className="text-sm text-muted-foreground">You don&apos;t have any sections yet — create one in Class Management first.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
      <div>
        <h2 className="font-semibold">Quiz Settings</h2>
        <p className="text-sm text-muted-foreground">Enable the quiz for this sub-module, per section.</p>
        {belowMinimum && (
          <p className="text-sm text-amber-600 mt-1">
            Requires at least {MIN_QUIZ_ITEMS} signs to enable (currently {itemCount}).
          </p>
        )}
      </div>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">{section.name}</span>
            <QuizToggle
              sectionId={section.id}
              sectionName={section.name}
              submoduleId={submoduleId}
              submoduleTitle={submoduleTitle}
              initialEnabled={enabledSectionIds.includes(section.id)}
              disabled={belowMinimum}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
