import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getStudentProgress } from '@/lib/queries/student-progress'
import StudentProgressView from '@/components/shared/StudentProgressView'
import DeleteAccountDialog from '@/components/admin/DeleteAccountDialog'
import { deleteStudentAction } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'

interface Props { params: Promise<{ studentId: string }> }

export default async function AdminStudentProfilePage({ params }: Props) {
  const { studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, section_id')
    .eq('id', studentId)
    .single()
  if (!student) notFound()

  const { data: section } = student.section_id
    ? await supabase.from('sections').select('name').eq('id', student.section_id).single()
    : { data: null }

  const { learnProgress, attempts, answers } = await getStudentProgress(supabase, studentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/students" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-4 w-4" /> Student Registry
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{student.full_name}</h1>
            <Badge variant={section ? 'default' : 'secondary'}>
              {section?.name ?? 'Unassigned'}
            </Badge>
          </div>
        </div>
        <DeleteAccountDialog
          id={student.id}
          name={student.full_name}
          entityLabel="student"
          deleteAction={deleteStudentAction}
          redirectTo="/admin/students"
        />
      </div>

      <StudentProgressView studentName={student.full_name} learnProgress={learnProgress} attempts={attempts} answers={answers} />
    </div>
  )
}
