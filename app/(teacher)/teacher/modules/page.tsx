import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import CreateCustomModuleForm from '@/components/teacher/CreateCustomModuleForm'
import ModulesCsvImportDialog from '@/components/teacher/ModulesCsvImportDialog'
import ModulesCsvExportButton from '@/components/teacher/ModulesCsvExportButton'
import EditCustomModuleDialog from '@/components/teacher/EditCustomModuleDialog'

export default async function TeacherModulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: modules, error: modulesError } = await supabase
    .from('custom_modules')
    .select('id, title, description, icon, color, created_at')
    .eq('teacher_id', user!.id)
    .order('created_at')

  if (modulesError) console.error('custom_modules select error:', modulesError)

  const moduleIds = modules?.map((m) => m.id) ?? []
  const [{ data: submoduleCounts }, { data: assignments }] = await Promise.all([
    moduleIds.length > 0
      ? supabase.from('custom_submodules').select('module_id').in('module_id', moduleIds)
      : Promise.resolve({ data: [] }),
    moduleIds.length > 0
      ? supabase.from('custom_module_sections').select('module_id').in('module_id', moduleIds)
      : Promise.resolve({ data: [] }),
  ])

  function submoduleCount(moduleId: string) {
    return submoduleCounts?.filter((s) => s.module_id === moduleId).length ?? 0
  }

  function sectionCount(moduleId: string) {
    return assignments?.filter((a) => a.module_id === moduleId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Modules</h1>
        <p className="text-sm text-muted-foreground">
          Create your own modules, sub-modules, and signs — separate from the built-in curriculum — and choose which of your sections can see them.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <CreateCustomModuleForm />
        <ModulesCsvImportDialog />
        <ModulesCsvExportButton />
      </div>

      <div className="space-y-2">
        {modules?.map((mod) => (
          <Link
            key={mod.id}
            href={`/teacher/modules/${mod.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                {mod.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{mod.title}</p>
                <p className="text-sm text-muted-foreground">
                  {submoduleCount(mod.id)} sub-module{submoduleCount(mod.id) === 1 ? '' : 's'} · assigned to {sectionCount(mod.id)} section{sectionCount(mod.id) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <EditCustomModuleDialog
                moduleId={mod.id}
                initialTitle={mod.title}
                initialDescription={mod.description}
                initialIcon={mod.icon}
                initialColor={mod.color}
              />
              <span className="text-muted-foreground ml-1">›</span>
            </div>
          </Link>
        ))}
        {(!modules || modules.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <BookOpen className="h-8 w-8" />
            <p>No custom modules yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
