import { createClient, type User } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const user = useState<User | null>('supabase-user', () => null)
  const ready = useState('supabase-auth-ready', () => false)
  const url = String(config.public.supabaseUrl || '')
  const anonKey = String(config.public.supabaseAnonKey || '')
  const supabase = url && anonKey ? createClient(url, anonKey) : null

  if (supabase) {
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
      ready.value = true
    })
    void supabase.auth.getSession().then(({ data }) => {
      user.value = data.session?.user ?? null
      ready.value = true
    })
  } else {
    ready.value = true
  }

  return {
    provide: {
      supabase,
      supabaseUser: user,
      supabaseReady: ready,
    },
  }
})
