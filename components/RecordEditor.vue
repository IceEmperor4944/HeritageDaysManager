<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'

const props = defineProps<{ resource: ResourceKey; recordId?: string | number }>()

const definition = computed(() => getResource(props.resource))
const editorKey = `record-editor-${props.resource}-${props.recordId || 'new'}`
const { data: recordData, status: recordStatus, error: recordError } = await useAsyncData(editorKey, async () => {
  if (!props.recordId) return null
  return $fetch<{ record: Record<string, unknown> }>(`/api/${props.resource}/${props.recordId}`)
})
const { data: contactsData, error: contactsError } = await useFetch<Array<{ id: string | number; label: string }>>('/api/contacts/options')
const { data: businessesData, error: businessesError } = await useFetch<Array<{ id: string | number; label: string }>>('/api/businesses/options')

const loadError = computed(() => recordError.value || contactsError.value || businessesError.value)
</script>

<template>
  <section>
    <PageHeading :title="recordId ? `Edit ${definition.singular}` : `Add ${definition.singular}`" :back-to="recordId ? `/${resource}/${recordId}` : `/${resource}`" back-label="Back" />
    <p v-if="recordStatus === 'pending'" class="loading-message">Loading record…</p>
    <div v-else-if="loadError" class="notice error-message" role="alert">
      {{ loadError.statusMessage || 'The form could not be loaded.' }}
    </div>
    <RecordForm v-else :resource="resource" :record-id="recordId" :initial="recordData?.record" :contacts="contactsData || []" :businesses="businessesData || []" />
  </section>
</template>
