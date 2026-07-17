import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CreateSectionForm from '@/components/teacher/CreateSectionForm'
import { Users } from 'lucide-react'

export default async function SectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sections } = await supabase
    .from('sections')
    .select('id, name, created_at')
    .eq('teacher_id', user!.id)
    .order('created_at')

  const sectionIds = sections?.map((s) => s.id) ?? []
  const { data: studentCounts } = sectionIds.length > 0
    ? await supabase.from('students').select('section_id').in('section_id', sectionIds)
    : { data: [] }

  function countForSection(id: string) {
    return studentCounts?.filter((s) => s.section_id === id).length ?? 0
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sections</h1>

      <CreateSectionForm />

      <div className="space-y-2">
        {sections?.map((section) => (
          <Link
            key={section.id}
            href={`/teacher/sections/${section.id}`}
            className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold">{section.name}</p>
                <p className="text-sm text-muted-foreground">{countForSection(section.id)} students</p>
              </div>
            </div>
            <span className="text-muted-foreground">›</span>
          </Link>
        ))}
        {(!sections || sections.length === 0) && (
          <p className="text-center text-muted-foreground py-8">No sections yet. Create one above.</p>
        )}
      </div>
    </div>
  )
}
