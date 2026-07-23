import { createClient } from '@/lib/supabase/server'

export interface Branding {
  systemName: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

const DEFAULT_SYSTEM_NAME = 'Kamay Aral'

// publicly readable — login page needs this before the visitor is authenticated
export async function getBranding(): Promise<Branding> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('system_name, logo_url, primary_color, secondary_color')
    .eq('id', true)
    .maybeSingle()

  return {
    systemName: data?.system_name?.trim() || DEFAULT_SYSTEM_NAME,
    logoUrl: data?.logo_url ?? null,
    primaryColor: data?.primary_color ?? null,
    secondaryColor: data?.secondary_color ?? null,
  }
}
