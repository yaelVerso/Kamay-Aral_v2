import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getStudentProgress } from '@/lib/queries/student-progress'
import { getReportableModulesForSection, toPickableFromModules } from '@/lib/queries/reportModules'
import StudentProgressView from '@/components/shared/StudentProgressView'
import StudentInfoCard from '@/components/shared/StudentInfoCard'
import GenerateReportButton from '@/components/shared/GenerateReportButton'
import StudentProgressReportButton from '@/components/shared/StudentProgressReportButton'

interface Props { params: Promise<{ sectionId: string; studentId: string }> }

export default async function StudentDetailPage({ params }: Props) {
  const { sectionId, studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: section }, { data: student }] = await Promise.all([
    supabase.from('sections').select('id, name, teacher_id').eq('id', sectionId).single(),
    supabase.from('students').select('id, full_name, id_number, email').eq('id', studentId).eq('section_id', sectionId).single(),
  ])
  if (!section || section.teacher_id !== user!.id) notFound()
  if (!student) notFound()

  const [{ learnProgress, attempts, answers, practiceAnswers }, allModules] = await Promise.all([
    getStudentProgress(supabase, studentId),
    getReportableModulesForSection(supabase, sectionId),
  ])
  const pickableModules = toPickableFromModules(allModules)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/teacher/sections/${sectionId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> {section.name}
          </Link>
          <h1 className="text-2xl font-bold">{student.full_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <GenerateReportButton studentId={studentId} studentName={student.full_name} modules={pickableModules} />
          <StudentProgressReportButton studentId={studentId} studentName={student.full_name} modules={pickableModules} />
        </div>
      </div>

      <StudentInfoCard idNumber={student.id_number} email={student.email} sectionName={section.name} />

      <StudentProgressView
        studentName={student.full_name}
        sectionId={section.id}
        sectionName={section.name}
        modules={allModules}
        learnProgress={learnProgress}
        attempts={attempts}
        answers={answers}
        practiceAnswers={practiceAnswers}
      />
    </div>
  )
}
