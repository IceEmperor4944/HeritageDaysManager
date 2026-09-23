import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase(): SupabaseClient<any> {
  const client = useNuxtApp().$supabase
  if (!client) {
    throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return client as SupabaseClient<any>
}

export function useSupabaseUser() {
  return useNuxtApp().$supabaseUser
}

export function supabaseConfigured(): boolean {
  const config = useRuntimeConfig()
  return Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey)
}
