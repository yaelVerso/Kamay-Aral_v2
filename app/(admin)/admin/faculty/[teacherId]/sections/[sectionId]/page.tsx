import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import SectionDetailView from '@/components/shared/SectionDetailView'
import type { ModuleOption } from '@/components/shared/SectionPerformanceList'
import DeleteSectionButton from '@/components/shared/DeleteSectionButton'
import EditSectionNameButton from '@/components/shared/EditSectionNameButton'
import GenerateSectionReportButton from '@/components/shared/GenerateSectionReportButton'
import { getCustomModulesForSection } from '@/lib/queries/customContent'
import { getAllAdminModules } from '@/lib/queries/adminContent'
import { getPickableModulesForSection } from '@/lib/queries/reportModules'

interface Props { params: Promise<{ teacherId: string; sectionId: string }> }

export default async function AdminSectionDetailPage({ params }: Props) {
  const { teacherId, sectionId } = await params
  const supabase = await createClient()

  const [{ data: section }, { data: students }, { data: quizSettings }, customModules, adminModules, pickableModules] = await Promise.all([
    supabase.from('sections').select('id, name, teacher_id').eq('id', sectionId).single(),
    supabase.from('students').select('id, full_name, is_active').eq('section_id', sectionId).order('full_name'),
    supabase.from('quiz_settings').select('submodule_id, enabled').eq('section_id', sectionId),
    getCustomModulesForSection(supabase, sectionId),
    getAllAdminModules(supabase),
    getPickableModulesForSection(supabase, sectionId),
  ])

  if (!section || section.teacher_id !== teacherId) notFound()

  function isEnabled(submoduleId: string) {
    return quizSettings?.find((q) => q.submodule_id === submoduleId)?.enabled ?? false
  }

  const studentIds = students?.map((s) => s.id) ?? []
  const { data: attempts } = studentIds.length > 0
    ? await supabase
        .from('quiz_attempts')
        .select('student_id, submodule_id, score, total, submitted_at')
        .in('student_id', studentIds)
        .eq('is_active', true)
        .not('submitted_at', 'is', null)
    : { data: [] }

  const enabledSubmoduleIds = [
    ...customModules.flatMap((mod) => mod.subModules.filter((sm) => isEnabled(sm.id)).map((sm) => sm.id)),
    ...adminModules.flatMap((mod) => mod.subModules.filter((sm) => isEnabled(sm.id)).map((sm) => sm.id)),
  ]

  const moduleOptions: ModuleOption[] = [
    ...customModules.map((mod) => ({ id: mod.id, title: mod.title, icon: mod.icon, subModuleIds: mod.subModules.map((sm) => sm.id) })),
    ...adminModules.map((mod) => ({ id: mod.id, title: mod.title, icon: mod.icon, subModuleIds: mod.subModules.map((sm) => sm.id) })),
  ]

  const studentRows = (students ?? []).map((student) => {
    const studentAttempts = (attempts ?? [])
      .filter((a) => a.student_id === student.id)
      .sort((a, b) => new Date(a.submitted_at!).getTime() - new Date(b.submitted_at!).getTime())
    const percents = studentAttempts.map((a) => (a.total ? (a.score ?? 0) / a.total * 100 : 0))
    const avg = percents.length > 0 ? Math.round(percents.reduce((sum, p) => sum + p, 0) / percents.length) : null

    let trend: 'up' | 'down' | null = null
    if (percents.length >= 2) {
      const latest = percents[percents.length - 1]
      const priorAvg = percents.slice(0, -1).reduce((sum, p) => sum + p, 0) / (percents.length - 1)
      if (latest > priorAvg) trend = 'up'
      else if (latest < priorAvg) trend = 'down'
    }

    return { id: student.id, full_name: student.full_name, avg, trend, completedCount: studentAttempts.length, is_active: student.is_active }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href={`/admin/faculty/${teacherId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-4 w-4" /> Teacher
          </Link>
          <h1 className="text-2xl font-bold">Section: {section.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <GenerateSectionReportButton sectionId={sectionId} sectionName={section.name} modules={pickableModules} />
          <EditSectionNameButton sectionId={sectionId} sectionName={section.name} />
          <DeleteSectionButton sectionId={sectionId} sectionName={section.name} redirectTo={`/admin/faculty/${teacherId}`} />
        </div>
      </div>

      <SectionDetailView
        sectionId={sectionId}
        sectionName={section.name}
        students={studentRows}
        attempts={(attempts ?? []).map((a) => ({ ...a, submitted_at: a.submitted_at! }))}
        enabledSubmoduleIds={enabledSubmoduleIds}
        modules={moduleOptions}
        studentHref={(studentId) => `/admin/students/${studentId}`}
      />
    </div>
  )
}
