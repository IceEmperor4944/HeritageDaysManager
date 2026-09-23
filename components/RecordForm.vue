<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'
import type { Payload } from '~/shared/validation'

type FormValue = string | number | boolean | null

const props = defineProps<{
  resource: ResourceKey
  initial?: Record<string, unknown> | null
  contacts: Array<{ id: string | number; label: string }>
  businesses: Array<{ id: string | number; label: string }>
  recordId?: string | number
}>()

const definition = computed(() => getResource(props.resource))
const form = reactive<Record<string, FormValue>>({})
const errors = ref<Record<string, string>>({})
const submitError = ref('')
const saving = ref(false)

function toLocalDateTime(value: unknown) {
  if (!value) return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.valueOf())) return ''
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

function populateForm() {
  for (const field of definition.value.fields) {
    const existing = props.initial?.[field.key]
    if (field.type === 'boolean') form[field.key] = existing === true
    else if (field.type === 'currency') form[field.key] = existing === undefined || existing === null ? 0 : Number(existing)
    else if (field.type === 'datetime') form[field.key] = toLocalDateTime(existing)
    else form[field.key] = existing === undefined || existing === null ? '' : String(existing)
  }
}

watch(() => [props.resource, props.initial] as const, populateForm, { immediate: true, deep: true })

function buildPayload(): Payload {
  const payload: Payload = {}
  for (const field of definition.value.fields) {
    const value = form[field.key]
    if (field.type === 'boolean') payload[field.key] = Boolean(value)
    else if (field.type === 'datetime') payload[field.key] = value ? new Date(String(value)).toISOString() : null
    else if (field.type === 'number') payload[field.key] = value === '' || value === null ? null : Number(value)
    else if (field.type === 'currency') payload[field.key] = Number(value)
    else if (field.type === 'relation') payload[field.key] = value === '' || value === null ? null : Number(value)
    else payload[field.key] = value === '' ? null : String(value)
  }
  return payload
}

async function submit() {
  errors.value = {}
  submitError.value = ''
  saving.value = true
  try {
    const isEdit = Boolean(props.recordId)
    const response = await $fetch<{ record: Record<string, unknown> }>(`/api/${props.resource}${isEdit ? `/${props.recordId}` : ''}`, {
      method: isEdit ? 'PATCH' : 'POST', body: buildPayload(),
    })
    await navigateTo(`/${props.resource}/${response.record.id}`)
  } catch (error: unknown) {
    const fetchError = error as { data?: { data?: { errors?: Record<string, string> } }; statusMessage?: string; message?: string }
    errors.value = fetchError.data?.data?.errors || {}
    submitError.value = fetchError.statusMessage || fetchError.message || 'The record could not be saved.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="record-form" @submit.prevent="submit">
    <p v-if="submitError" class="form-message error-message" role="alert">{{ submitError }}</p>
    <div v-for="field in definition.fields" :key="field.key" class="form-field" :class="{ 'form-field-wide': field.type === 'textarea' }">
      <label v-if="field.type !== 'boolean'" :for="field.key">
        {{ field.label }}<span v-if="field.required" aria-hidden="true"> *</span>
      </label>

      <label v-if="field.type === 'boolean'" class="checkbox-label" :for="field.key">
        <input :id="field.key" v-model="form[field.key]" type="checkbox">
        {{ field.label }}
      </label>
      <select v-else-if="field.type === 'relation'" :id="field.key" v-model="form[field.key]" :required="field.required" :aria-describedby="errors[field.key] ? `${field.key}-error` : undefined">
        <option value="">Select {{ field.label }}</option>
        <option v-for="option in field.relation === 'contacts' ? contacts : businesses" :key="String(option.id)" :value="String(option.id)">{{ option.label }}</option>
      </select>
      <textarea v-else-if="field.type === 'textarea'" :id="field.key" v-model="form[field.key]" rows="4" :required="field.required" :aria-describedby="errors[field.key] ? `${field.key}-error` : undefined" />
      <input v-else :id="field.key" v-model="form[field.key]" :type="field.type === 'datetime' ? 'datetime-local' : field.type === 'currency' ? 'number' : field.type" :required="field.required" :min="field.type === 'number' || field.type === 'currency' ? '0' : undefined" :step="field.type === 'currency' ? '0.01' : field.type === 'number' ? 'any' : undefined" :aria-describedby="errors[field.key] ? `${field.key}-error` : undefined">
      <p v-if="errors[field.key]" :id="`${field.key}-error`" class="field-error" role="alert">{{ errors[field.key] }}</p>
    </div>
    <div class="form-actions">
      <button class="button primary" type="submit" :disabled="saving">{{ saving ? 'Saving…' : recordId ? 'Save changes' : `Add ${definition.singular}` }}</button>
      <NuxtLink class="button secondary" :to="recordId ? `/${resource}/${recordId}` : `/${resource}`">Cancel</NuxtLink>
    </div>
  </form>
</template>
