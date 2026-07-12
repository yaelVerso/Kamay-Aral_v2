import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import SectionDetailView from '@/components/shared/SectionDetailView'
import DeleteSectionButton from '@/components/shared/DeleteSectionButton'

interface Props { params: Promise<{ sectionId: string }> }

export default async function SectionDetailPage({ params }: Props) {
  const { sectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: section } = await supabase
    .from('sections')
    .select('id, name, teacher_id')
    .eq('id', sectionId)
    .single()

  if (!section || section.teacher_id !== user!.id) notFound()

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('section_id', sectionId)
    .order('full_name')

  const { data: quizSettings } = await supabase
    .from('quiz_settings')
    .select('submodule_id, enabled')
    .eq('section_id', sectionId)

  function isEnabled(submoduleId: string) {
    return quizSettings?.find((q) => q.submodule_id === submoduleId)?.enabled ?? false
  }

  const studentIds = students?.map((s) => s.id) ?? []
  const { data: attempts } = studentIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('student_id, submodule_id, score, total')
        .in('student_id', studentIds)
        .not('submitted_at', 'is', null)
    : { data: [] }

  const studentRows = (students ?? []).map((student) => {
    const studentAttempts = attempts?.filter((a) => a.student_id === student.id) ?? []
    const avg = studentAttempts.length > 0
      ? Math.round(
          studentAttempts.reduce((acc, a) => acc + (a.total ? (a.score ?? 0) / a.total : 0), 0)
          / studentAttempts.length * 100
        )
      : null
    return { id: student.id, full_name: student.full_name, avg }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/teacher/sections" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-4 w-4" /> Sections
          </Link>
          <h1 className="text-2xl font-bold">Section: {section.name}</h1>
        </div>
        <DeleteSectionButton sectionId={sectionId} sectionName={section.name} redirectTo="/teacher/sections" />
      </div>

      <SectionDetailView
        sectionId={sectionId}
        sectionName={section.name}
        students={studentRows}
        isEnabled={isEnabled}
        studentHref={(studentId) => `/teacher/sections/${sectionId}/students/${studentId}`}
      />
    </div>
  )
}
