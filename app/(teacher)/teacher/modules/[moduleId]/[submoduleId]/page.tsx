import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import CustomSignDialog from '@/components/teacher/CustomSignDialog'
import DeleteCustomSignButton from '@/components/teacher/DeleteCustomSignButton'
import SignsCsvImportDialog from '@/components/teacher/SignsCsvImportDialog'
import SignsCsvExportButton from '@/components/teacher/SignsCsvExportButton'
import SubmoduleExportDeleteControls from '@/components/teacher/SubmoduleExportDeleteControls'
import QuizSectionAssignment from '@/components/teacher/QuizSectionAssignment'
import SignVideoVariationsDialog from '@/components/teacher/SignVideoVariationsDialog'
import { parseVideoUrl } from '@/lib/videoEmbed'

interface Props { params: Promise<{ moduleId: string; submoduleId: string }> }

export default async function TeacherSubmoduleDetailPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: mod } = await supabase
    .from('custom_modules')
    .select('id, title, teacher_id')
    .eq('id', moduleId)
    .single()
  if (!mod || mod.teacher_id !== user!.id) notFound()

  const { data: submodule } = await supabase
    .from('custom_submodules')
    .select('id, title, short_title')
    .eq('id', submoduleId)
    .eq('module_id', moduleId)
    .single()
  if (!submodule) notFound()

  const { data: signs } = await supabase
    .from('custom_signs')
    .select('id, label, label_fil, description, video_url, image_url, accepted_answers, order')
    .eq('submodule_id', submoduleId)
    .order('order')

  const signIds = signs?.map((s) => s.id) ?? []
  const [{ data: sections }, { data: quizSettings }, { data: variations }] = await Promise.all([
    supabase.from('sections').select('id, name').eq('teacher_id', user!.id).order('name'),
    supabase.from('quiz_settings').select('section_id').eq('submodule_id', submoduleId).eq('enabled', true),
    signIds.length > 0
      ? supabase.from('custom_sign_videos').select('id, sign_id, video_url, label, order').in('sign_id', signIds).order('order')
      : Promise.resolve({ data: [] as { id: string; sign_id: string; video_url: string; label: string | null; order: number }[] }),
  ])

  function variationsFor(signId: string) {
    return (variations ?? []).filter((v) => v.sign_id === signId)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/modules/${moduleId}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> {mod.title}
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{submodule.title}</h1>
          <SubmoduleExportDeleteControls moduleId={moduleId} submoduleId={submoduleId} submoduleTitle={submodule.title} />
        </div>
      </div>

      <QuizSectionAssignment
        submoduleId={submoduleId}
        submoduleTitle={submodule.title}
        sections={sections ?? []}
        enabledSectionIds={(quizSettings ?? []).map((q) => q.section_id)}
        itemCount={signs?.length ?? 0}
      />

      <div className="flex flex-wrap items-start gap-2">
        <CustomSignDialog submoduleId={submoduleId} nextOrder={signs?.length ?? 0} />
        <SignsCsvImportDialog submoduleId={submoduleId} nextOrder={signs?.length ?? 0} />
        <SignsCsvExportButton signs={signs ?? []} submoduleTitle={submodule.title} />
      </div>

      <div className="space-y-2">
        {signs?.map((sign) => {
          const parsed = parseVideoUrl(sign.video_url)
          return (
            <div key={sign.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{sign.label}</p>
                  {sign.label_fil && <span className="text-sm text-muted-foreground">({sign.label_fil})</span>}
                </div>
                {sign.description && <p className="text-sm text-muted-foreground truncate">{sign.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {parsed.source === 'unknown' ? (
                    <span className="text-amber-600">⚠ Video link not recognized (use a YouTube link)</span>
                  ) : (
                    <>Video: YouTube</>
                  )}
                  {sign.accepted_answers?.length > 0 && ` · Accepted answers: ${sign.accepted_answers.join(', ')}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <SignVideoVariationsDialog
                  signId={sign.id}
                  signLabel={sign.label}
                  nextOrder={variationsFor(sign.id).length}
                  variations={variationsFor(sign.id)}
                />
                <CustomSignDialog submoduleId={submoduleId} nextOrder={signs.length} editingSign={sign} />
                <DeleteCustomSignButton signId={sign.id} signLabel={sign.label} />
              </div>
            </div>
          )
        })}
        {(!signs || signs.length === 0) && (
          <p className="text-center text-muted-foreground py-6">No signs yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
