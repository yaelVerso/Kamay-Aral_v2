import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getStudentProgress } from '@/lib/queries/student-progress'
import { getReportableModulesForSection, toPickableFromModules } from '@/lib/queries/reportModules'
import StudentProgressView from '@/components/shared/StudentProgressView'
import StudentInfoCard from '@/components/shared/StudentInfoCard'
import AccountStatusToggle from '@/components/admin/AccountStatusToggle'
import EditStudentDialog from '@/components/admin/EditStudentDialog'
import ResendInviteButton from '@/components/admin/ResendInviteButton'
import { deactivateStudentAction, reactivateStudentAction, resendStudentInviteAction } from '@/app/actions/admin'
import { Badge } from '@/components/ui/badge'
import GenerateReportButton from '@/components/shared/GenerateReportButton'
import StudentProgressReportButton from '@/components/shared/StudentProgressReportButton'

interface Props { params: Promise<{ studentId: string }> }

export default async function AdminStudentProfilePage({ params }: Props) {
  const { studentId } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('id, full_name, first_name, last_name, email, id_number, section_id, is_active')
    .eq('id', studentId)
    .single()
  if (!student) notFound()

  const { data: section } = student.section_id
    ? await supabase.from('sections').select('name').eq('id', student.section_id).single()
    : { data: null }

  const { data: allSections } = await supabase
    .from('sections')
    .select('id, name, teacher_id')
    .order('name')
  const teacherIds = [...new Set((allSections ?? []).map((s) => s.teacher_id))]
  const { data: sectionTeachers } = teacherIds.length > 0
    ? await supabase.from('teachers').select('id, full_name').in('id', teacherIds)
    : { data: [] }
  const teacherNameById = new Map((sectionTeachers ?? []).map((t) => [t.id, t.full_name]))
  const sectionOptions = (allSections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    teacherName: teacherNameById.get(s.teacher_id) ?? 'Unknown',
  }))

  const [{ learnProgress, attempts, answers, practiceAnswers }, allModules] = await Promise.all([
    getStudentProgress(supabase, studentId),
    getReportableModulesForSection(supabase, student.section_id),
  ])
  const pickableModules = toPickableFromModules(allModules)

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
            <Badge variant={student.is_active ? 'default' : 'secondary'}>
              {student.is_active ? 'Active' : 'Deactivated'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GenerateReportButton studentId={student.id} studentName={student.full_name} sectionName={section?.name ?? null} modules={pickableModules} />
          <StudentProgressReportButton studentId={student.id} studentName={student.full_name} sectionName={section?.name ?? null} modules={pickableModules} />
          <EditStudentDialog
            studentId={student.id}
            firstName={student.first_name ?? ''}
            lastName={student.last_name ?? ''}
            email={student.email ?? ''}
            idNumber={student.id_number ?? ''}
            sectionId={student.section_id}
            sections={sectionOptions}
          />
          <ResendInviteButton id={student.id} resendAction={resendStudentInviteAction} />
          <AccountStatusToggle
            id={student.id}
            name={student.full_name}
            isActive={student.is_active}
            entityLabel="student"
            deactivateAction={deactivateStudentAction}
            reactivateAction={reactivateStudentAction}
          />
        </div>
      </div>

      <StudentInfoCard idNumber={student.id_number} email={student.email} sectionName={section?.name ?? null} />

      <StudentProgressView
        studentName={student.full_name}
        sectionId={student.section_id}
        sectionName={section?.name}
        modules={allModules}
        learnProgress={learnProgress}
        attempts={attempts}
        answers={answers}
        practiceAnswers={practiceAnswers}
      />
    </div>
  )
}
