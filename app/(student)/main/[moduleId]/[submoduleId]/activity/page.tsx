import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminModuleTree, getTeacherIdForStudent } from '@/lib/queries/adminContent'
import ActivityRunner from '@/components/activities/ActivityRunner'
import NoSignsYet from '@/components/student/NoSignsYet'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function MainActivityPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const teacherId = await getTeacherIdForStudent(supabase, user!.id)
  const mod = await getAdminModuleTree(supabase, moduleId, teacherId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()
  if (submodule.items.length === 0) return <NoSignsYet backHref={`/main/${moduleId}`} />

  return <ActivityRunner module={mod} submodule={submodule} mode="activity" backHref={`/main/${moduleId}`} />
}
