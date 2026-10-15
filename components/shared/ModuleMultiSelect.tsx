import type { PickableModule } from '@/lib/queries/reportModules'

interface Props {
  modules: PickableModule[]
  selected: Set<string>
  onToggle: (moduleId: string) => void
  onToggleAll: () => void
}

/** Which modules (custom or admin) to include when generating a report — shared by the per-student and per-section report dialogs. */
export default function ModuleMultiSelect({ modules, selected, onToggle, onToggleAll }: Props) {
  const allSelected = modules.length > 0 && selected.size === modules.length

  return (
    <div className="space-y-1.5">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className="h-4 w-4"
        />
        <span className="font-medium">Select All</span>
      </label>
      <div className="max-h-64 space-y-1.5 overflow-y-auto">
        {modules.map((mod) => (
          <label
            key={mod.id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selected.has(mod.id)}
              onChange={() => onToggle(mod.id)}
              className="h-4 w-4"
            />
            <span>{mod.icon}</span>
            <span className="font-medium">{mod.title}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
