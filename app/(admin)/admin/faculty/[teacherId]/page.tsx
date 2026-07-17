import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Users } from 'lucide-react'
import CreateSectionForTeacherForm from '@/components/admin/CreateSectionForTeacherForm'
import AccountStatusToggle from '@/components/admin/AccountStatusToggle'
import { deactivateTeacherAction, reactivateTeacherAction } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'

interface Props { params: Promise<{ teacherId: string }> }

export default async function AdminTeacherProfilePage({ params }: Props) {
  const { teacherId } = await params
  const supabase = await createClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, full_name, is_active')
    .eq('id', teacherId)
    .single()
  if (!teacher) notFound()

  const { data: sections } = await supabase
    .from('sections')
    .select('id, name')
    .eq('teacher_id', teacherId)
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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/faculty" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-4 w-4" /> Faculty
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{teacher.full_name}</h1>
            <Badge variant={teacher.is_active ? 'default' : 'secondary'}>
              {teacher.is_active ? 'Active' : 'Deactivated'}
            </Badge>
          </div>
        </div>
        <AccountStatusToggle
          id={teacher.id}
          name={teacher.full_name}
          isActive={teacher.is_active}
          entityLabel="teacher"
          deactivateAction={deactivateTeacherAction}
          reactivateAction={reactivateTeacherAction}
        />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Sections</h2>
        <CreateSectionForTeacherForm teacherId={teacherId} />

        <div className="mt-3 space-y-2">
          {sections?.map((section) => (
            <Link
              key={section.id}
              href={`/admin/faculty/${teacherId}/sections/${section.id}`}
              className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
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
            <p className="text-center text-muted-foreground py-8">No sections yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
