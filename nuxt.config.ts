export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      // GitHub Pages serves the generated fallback for record paths not known at build time.
      // Nuxt's client router then resolves the dynamic route at runtime.
    },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
