import { createClient } from '@/lib/supabase/server'
import FacultySearchList from '@/components/admin/FacultySearchList'
import CreateTeacherDialog from '@/components/admin/CreateTeacherDialog'

export default async function AdminFacultyPage() {
  const supabase = await createClient()

  const [{ data: teachers }, { data: sections }] = await Promise.all([
    supabase.from('teachers').select('id, full_name, id_number, is_active').order('full_name'),
    supabase.from('sections').select('teacher_id'),
  ])

  const teacherList = (teachers ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    idNumber: t.id_number,
    isActive: t.is_active,
    sectionCount: sections?.filter((s) => s.teacher_id === t.id).length ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faculty Management</h1>
          <p className="text-muted-foreground">All registered teachers.</p>
        </div>
        <CreateTeacherDialog />
      </div>

      <FacultySearchList teachers={teacherList} />
    </div>
  )
}
