<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  actionTo?: string
  actionLabel?: string
  backTo?: string
  backLabel?: string
}>(), {
  actionLabel: 'Add record',
  backLabel: 'Back',
})
</script>

<template>
  <div class="page-heading">
    <div>
      <NuxtLink v-if="backTo" class="back-link" :to="backTo">← {{ backLabel }}</NuxtLink>
      <h1>{{ title }}</h1>
    </div>
    <NuxtLink v-if="actionTo" class="button primary" :to="actionTo">{{ actionLabel }}</NuxtLink>
  </div>
</template>
