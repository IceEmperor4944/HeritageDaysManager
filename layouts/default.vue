<template>
  <div class="app-shell">
    <AppHeader v-if="useRoute().path !== '/login'" />
    <main class="page-content">
      <slot />
    </main>
  </div>
</template>
