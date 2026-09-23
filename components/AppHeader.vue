<script setup lang="ts">
const supabase = useNuxtApp().$supabase
const user = useSupabaseUser()
const signingOut = ref(false)

async function signOut() {
  if (!supabase) return
  signingOut.value = true
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<template>
  <header class="site-header">
    <NuxtLink class="brand" to="/">Heritage Days Manager</NuxtLink>
    <nav aria-label="Primary navigation">
      <NuxtLink to="/contacts">Contacts</NuxtLink>
      <NuxtLink to="/businesses">Businesses</NuxtLink>
      <NuxtLink to="/vendors">Vendors</NuxtLink>
      <NuxtLink to="/floats">Floats</NuxtLink>
    </nav>
    <div class="header-account">
      <span v-if="user?.email" class="muted">{{ user.email }}</span>
      <button class="button-link" type="button" :disabled="signingOut" @click="signOut">{{ signingOut ? 'Signing out…' : 'Sign out' }}</button>
    </div>
  </header>
</template>
