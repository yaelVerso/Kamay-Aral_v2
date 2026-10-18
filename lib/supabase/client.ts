import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient(options?: { detectSessionInUrl?: boolean }) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        ...(options?.detectSessionInUrl === false ? { detectSessionInUrl: false } : {}),
      },
    },
  )
}
