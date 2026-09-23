<script setup lang="ts">
import type { ResourceField } from '~/shared/resources'

const props = defineProps<{
  field: ResourceField
  value: unknown
  record: Record<string, unknown>
}>()

const relationName = computed(() => props.field.key === 'contact_id' ? 'contact_name' : 'business_name')
const text = computed(() => props.value === null || props.value === undefined || props.value === '' ? '—' : String(props.value))

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.valueOf()) ? String(value) : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatCurrency(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount) ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount) : '—'
}
</script>

<template>
  <StatusBadge v-if="field.type === 'boolean'" :value="Boolean(value)" />
  <NuxtLink v-else-if="field.type === 'relation' && value" :to="`/${field.relation}/${value}`">
    {{ record[relationName] || `View ${field.label}` }}
  </NuxtLink>
  <span v-else-if="field.type === 'datetime'">{{ formatDate(value) }}</span>
  <span v-else-if="field.type === 'currency'">{{ formatCurrency(value) }}</span>
  <span v-else class="field-value">{{ text }}</span>
</template>
