import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomModuleTree } from '@/lib/queries/customContent'
import LearnModeClient from '@/components/student/LearnModeClient'

interface Props {
  params: Promise<{ moduleId: string; submoduleId: string }>
}

export default async function ClassLearnPage({ params }: Props) {
  const { moduleId, submoduleId } = await params
  const supabase = await createClient()
  const mod = await getCustomModuleTree(supabase, moduleId)
  const submodule = mod?.subModules.find((sm) => sm.id === submoduleId)
  if (!mod || !submodule) notFound()

  return <LearnModeClient module={mod} submodule={submodule} backHref={`/class/${moduleId}`} />
}
