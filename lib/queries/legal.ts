import { createClient } from '@/lib/supabase/server'

export interface LegalDocument {
  content: string
  version: number
  updatedAt: string | null
}

// publicly readable — both students (for the acceptance gate) and admins
// (for the settings editor) need this before/without any extra round trip.
export async function getLegalDocument(): Promise<LegalDocument> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('legal_documents')
    .select('content, version, updated_at')
    .eq('id', true)
    .maybeSingle()

  return {
    content: data?.content ?? '',
    version: data?.version ?? 1,
    updatedAt: data?.updated_at ?? null,
  }
}
