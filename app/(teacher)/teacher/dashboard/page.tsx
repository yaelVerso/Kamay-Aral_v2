import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/content/registry'
import Link from 'next/link'
import { Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('first_name, full_name')
    .eq('id', user!.id)
    .single()

  const { data: sections } = await supabase
    .from('sections')
    .select('id, name')
    .eq('teacher_id', user!.id)
    .order('created_at')

  const sectionIds = sections?.map((s) => s.id) ?? []

  const { data: studentCounts } = sectionIds.length > 0
    ? await supabase.from('students').select('section_id').in('section_id', sectionIds)
    : { data: [] }

  const studentIds = sectionIds.length > 0
    ? (await supabase.from('students').select('id').in('section_id', sectionIds)).data?.map((s) => s.id) ?? []
    : []

  const { data: attempts } = studentIds.length > 0
    ? await supabase
      .from('quiz_attempts')
      .select('student_id, score, total')
      .in('student_id', studentIds)
      .not('submitted_at', 'is', null)
    : { data: [] }

  const needsAttention = new Set<string>()
  attempts?.forEach((a) => {
    if (a.total && a.score !== null && a.score / a.total < 0.5) {
      needsAttention.add(a.student_id)
    }
  })

  function countForSection(sectionId: string) {
    return studentCounts?.filter((s) => s.section_id === sectionId).length ?? 0
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-2xl font-bold">
          {teacher?.first_name ?? teacher?.full_name ?? user?.user_metadata?.full_name ?? 'Teacher'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-5">Here&apos;s an overview of your sections and student performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="bg-[#FDEFCA] shadow-[0_4px_0_#EFD385] ring-0 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#694B26]">Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-[#694B26]">{sections?.length ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-6 my-2">Active Classes</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDEFCA] shadow-[0_4px_0_#EFD385] ring-0 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#694B26]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-[#694B26]">{studentCounts?.length ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-6 my-2">Total Students</p>
          </CardContent>
        </Card>
        <Card className="bg-[#FDEFCA] shadow-[0_4px_0_#EFD385] ring-0 px-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-[#694B26] flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Need Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-amber-600">{needsAttention.size}</p>
            <p className="text-sm font-medium text-muted-foreground mt-6 my-2">No. of Struggling Students</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex h-full flex-col rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="font-semibold">Your Sections</h2>
          <Link href="/teacher/sections" className="text-sm text-[#0BC2D7] font-semibold hover:underline">
            Manage →
          </Link>
        </div>
        {sections && sections.length > 0 ? (
          <div className="max-h-80 space-y-2 overflow-y-auto px-4 pb-4">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/teacher/sections/${section.id}`}
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
          </div>
        ) : (
          <div className="mx-4 mb-4 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="mb-3">No sections yet.</p>
            <Link href="/teacher/sections" className="text-sm font-medium text-indigo-600 hover:underline">
              Create your first section →
            </Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Modules</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MODULES.map((mod) => (
            <div key={mod.id} className={`rounded-xl border bg-white p-3 shadow-sm ${mod.subModules.length === 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{mod.icon}</span>
                <p className="text-xs font-semibold leading-tight">{mod.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {mod.subModules.length > 0 ? `${mod.subModules.length} sub-modules` : 'Coming soon'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
