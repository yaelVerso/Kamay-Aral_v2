import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getStudentProgress } from '@/lib/queries/student-progress'
import StudentProgressView from '@/components/shared/StudentProgressView'

interface Props { params: Promise<{ sectionId: string; studentId: string }> }

export default async function StudentDetailPage({ params }: Props) {
  const { sectionId, studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: section } = await supabase
    .from('sections')
    .select('id, name, teacher_id')
    .eq('id', sectionId)
    .single()
  if (!section || section.teacher_id !== user!.id) notFound()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('id', studentId)
    .eq('section_id', sectionId)
    .single()
  if (!student) notFound()

  const { learnProgress, attempts, answers } = await getStudentProgress(supabase, studentId)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/teacher/sections/${sectionId}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> {section.name}
        </Link>
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
      </div>

      <StudentProgressView studentName={student.full_name} learnProgress={learnProgress} attempts={attempts} answers={answers} />
    </div>
  )
}
