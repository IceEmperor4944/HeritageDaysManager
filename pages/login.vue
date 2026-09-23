<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const supabase = useNuxtApp().$supabase
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const signingIn = ref(false)
const configured = computed(() => Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey))

async function signIn() {
  errorMessage.value = ''
  if (!supabase) {
    errorMessage.value = 'Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_ANON_KEY, then rebuild the site.'
    return
  }
  signingIn.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
    if (error) throw error
    const requestedPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    const destination = requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/'
    await navigateTo(destination)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not sign in.'
  } finally {
    signingIn.value = false
  }
}
</script>

<template>
  <section class="login-panel">
    <h1>Sign in to Heritage Days Manager</h1>
    <p>Use an account created by the application administrator.</p>
    <div v-if="!configured" class="notice error-message" role="alert">
      Supabase is not configured. Add the Supabase URL and public anon key to the environment and rebuild the site.
    </div>
    <form class="record-form" @submit.prevent="signIn">
      <div class="form-field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="username" required>
      </div>
      <div class="form-field">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required>
      </div>
      <p v-if="errorMessage" class="form-message error-message" role="alert">{{ errorMessage }}</p>
      <div class="form-actions">
        <button class="button primary" type="submit" :disabled="signingIn || !configured">{{ signingIn ? 'Signing in…' : 'Sign in' }}</button>
      </div>
    </form>
  </section>
</template>
