import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomModuleTree } from '@/lib/queries/customContent'
import ActivityRunner from '@/components/activities/ActivityRunner'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function ClassActivityPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const mod = await getCustomModuleTree(supabase, moduleId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()

  return <ActivityRunner module={mod} submodule={submodule} mode="activity" backHref={`/class/${moduleId}`} />
}
