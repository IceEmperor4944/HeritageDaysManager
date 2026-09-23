export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server || to.path === '/login') return

  const supabase = useNuxtApp().$supabase
  if (!supabase) return navigateTo('/login')

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
