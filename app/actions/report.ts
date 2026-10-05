'use server'

import type { Module } from '@/content/types'
import { createClient } from '@/lib/supabase/server'
import { getStudentProgress } from '@/lib/queries/student-progress'
import { buildTopicReportData, buildClassReportData, type TopicReportData } from '@/lib/queries/report'
import { getReportableModulesForSection } from '@/lib/queries/reportModules'
import { generateStudentReport } from '@/lib/ai/studentReport'
import { generateClassReport } from '@/lib/ai/classReport'

/** Empty/undefined selection means "no filter" — every module is included. */
function resolveModules(moduleIds: string[] | undefined, allModules: Module[]): Module[] {
  if (!moduleIds || moduleIds.length === 0) return allModules
  const idSet = new Set(moduleIds)
  return allModules.filter((mod) => idSet.has(mod.id))
}

export async function generateReportAction(studentId: string, moduleIds?: string[]): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'

  const { data: student } = await supabase
    .from('students')
    .select('section_id')
    .eq('id', studentId)
    .single()
  if (!student) throw new Error('Student not found')

  if (!isAdmin) {
    if (!student.section_id) throw new Error('Not authorized')
    const { data: section } = await supabase
      .from('sections')
      .select('teacher_id')
      .eq('id', student.section_id)
      .single()
    if (!section || section.teacher_id !== user.id) throw new Error('Not authorized')
  }

  const allModules = await getReportableModulesForSection(supabase, student.section_id)
  const modules = resolveModules(moduleIds, allModules)

  const { attempts, answers, practiceAnswers } = await getStudentProgress(supabase, studentId)
  const topics = buildTopicReportData(modules, attempts, answers, practiceAnswers)

  try {
    return await generateStudentReport(topics)
  } catch {
    throw new Error('Could not generate the report right now. Please try again.')
  }
}

export async function generateSectionReportAction(sectionId: string, moduleIds?: string[]): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const isAdmin = user.user_metadata?.role === 'admin'

  const { data: section } = await supabase
    .from('sections')
    .select('name, teacher_id')
    .eq('id', sectionId)
    .single()
  if (!section) throw new Error('Section not found')
  if (!isAdmin && section.teacher_id !== user.id) throw new Error('Not authorized')

  const { data: students } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('section_id', sectionId)
  if (!students || students.length === 0) {
    return `${section.name} has no students yet.`
  }

  const allModules = await getReportableModulesForSection(supabase, sectionId)
  const modules = resolveModules(moduleIds, allModules)

  // Students are referred to by a throwaway per-request label, never their real
  // name, in anything sent to Gemini — the label-to-name map below exists only
  // for the duration of this call, to rehydrate the final text afterward.
  const labelToName = new Map<string, string>(students.map((s, i) => [`Student ${i + 1}`, s.full_name]))

  const perStudent: { studentName: string; topics: TopicReportData[] }[] = await Promise.all(
    students.map(async (s, i) => {
      const { attempts, answers, practiceAnswers } = await getStudentProgress(supabase, s.id)
      return { studentName: `Student ${i + 1}`, topics: buildTopicReportData(modules, attempts, answers, practiceAnswers) }
    }),
  )

  const classData = buildClassReportData(perStudent)

  try {
    const report = await generateClassReport(section.name, classData)
    // Longest labels first so "Student 10" is replaced before "Student 1" can
    // partially match inside it.
    const labels = [...labelToName.keys()].sort((a, b) => b.length - a.length)
    return labels.reduce((text, label) => text.split(label).join(labelToName.get(label)!), report)
  } catch {
    throw new Error('Could not generate the report right now. Please try again.')
  }
}
