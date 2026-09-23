<script setup lang="ts">
defineProps<{ value: boolean }>()
</script>

<template>
  <span class="status-badge" :class="value ? 'status-yes' : 'status-no'">
    {{ value ? 'Yes' : 'No' }}
  </span>
</template>
