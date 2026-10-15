import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomModuleTree } from '@/lib/queries/customContent'
import ActivityRunner from '@/components/activities/ActivityRunner'
import NoSignsYet from '@/components/student/NoSignsYet'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function ClassActivityPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const mod = await getCustomModuleTree(supabase, moduleId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()
  if (submodule.items.length === 0) return <NoSignsYet backHref={`/class/${moduleId}`} />

  return <ActivityRunner module={mod} submodule={submodule} mode="activity" backHref={`/class/${moduleId}`} />
}
