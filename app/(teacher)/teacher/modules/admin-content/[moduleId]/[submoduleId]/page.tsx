import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import QuizSectionAssignment from '@/components/teacher/QuizSectionAssignment'
import AdminSignOverrideControl from '@/components/teacher/AdminSignOverrideControl'

interface Props { params: Promise<{ moduleId: string; submoduleId: string }> }

export default async function AdminContentSubmoduleDetailPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mod } = await supabase
    .from('admin_modules')
    .select('id, title')
    .eq('id', moduleId)
    .eq('is_active', true)
    .maybeSingle()
  if (!mod) notFound()

  const [{ data: submodule }, { data: signs }] = await Promise.all([
    supabase.from('admin_submodules').select('id, title').eq('id', submoduleId).eq('module_id', moduleId).eq('is_active', true).maybeSingle(),
    supabase.from('admin_signs').select('id, label').eq('submodule_id', submoduleId).eq('is_active', true).order('order'),
  ])
  if (!submodule) notFound()

  const signIds = signs?.map((s) => s.id) ?? []
  const [{ data: sections }, { data: quizSettings }, { data: overrides }] = await Promise.all([
    supabase.from('sections').select('id, name').eq('teacher_id', user!.id).order('name'),
    supabase.from('quiz_settings').select('section_id').eq('submodule_id', submoduleId).eq('enabled', true),
    signIds.length > 0
      ? supabase.from('admin_sign_teacher_overrides').select('admin_sign_id, video_url').eq('teacher_id', user!.id).in('admin_sign_id', signIds)
      : Promise.resolve({ data: [] as { admin_sign_id: string; video_url: string }[] }),
  ])

  function overrideFor(signId: string) {
    return overrides?.find((o) => o.admin_sign_id === signId)?.video_url ?? null
  }

  const signCount = signs?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/modules/admin-content/${moduleId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> {mod.title}
        </Link>
        <h1 className="text-2xl font-bold">{submodule.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{signCount} sign{signCount === 1 ? '' : 's'} — managed by admin, not editable here.</p>
      </div>

      <QuizSectionAssignment
        submoduleId={submoduleId}
        submoduleTitle={submodule.title}
        sections={sections ?? []}
        enabledSectionIds={(quizSettings ?? []).map((q) => q.section_id)}
        itemCount={signCount}
      />

      {signs && signs.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold">Your Video Overrides</h2>
            <p className="text-sm text-muted-foreground">
              Swap in your own video for a sign, just for your own students — used in Learn, Practice, and Quiz. Admin&apos;s original stays viewable as a Learn-mode variation.
            </p>
          </div>
          <div className="space-y-2">
            {signs.map((sign) => (
              <div key={sign.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
                <p className="font-medium text-sm">{sign.label}</p>
                <AdminSignOverrideControl adminSignId={sign.id} signLabel={sign.label} currentOverrideUrl={overrideFor(sign.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
