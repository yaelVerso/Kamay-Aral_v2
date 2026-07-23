import { createClient } from '@/lib/supabase/server'
import StudentSearchList from '@/components/admin/StudentSearchList'
import CreateStudentDialog from '@/components/shared/CreateStudentDialog'

export default async function AdminStudentsPage() {
  const supabase = await createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, email, id_number, section_id, is_active')
    .order('full_name')

  const sectionIds = [...new Set((students ?? []).map((s) => s.section_id).filter((id): id is string => !!id))]
  const { data: sections } = sectionIds.length > 0
    ? await supabase.from('sections').select('id, name').in('id', sectionIds)
    : { data: [] }

  function sectionName(sectionId: string | null) {
    if (!sectionId) return null
    return sections?.find((s) => s.id === sectionId)?.name ?? null
  }

  const studentList = (students ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
    idNumber: s.id_number,
    sectionName: sectionName(s.section_id),
    isActive: s.is_active,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Registry</h1>
          <p className="text-muted-foreground">All registered students.</p>
        </div>
        <CreateStudentDialog />
      </div>

      <StudentSearchList students={studentList} />
    </div>
  )
}
