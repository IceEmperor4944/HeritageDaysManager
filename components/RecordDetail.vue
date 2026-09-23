<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'

interface RelatedGroup {
  resource: ResourceKey
  label: string
  items: Array<{ id: string | number; title: string; secondary?: string }>
}

const props = defineProps<{ resource: ResourceKey; recordId: string | number }>()
const definition = computed(() => getResource(props.resource))
const { data, status, error, refresh } = await useFetch<{ record: Record<string, unknown>; related: RelatedGroup[] }>(() => `/api/${props.resource}/${props.recordId}`)
const deleteMessage = ref('')
const deleting = ref(false)

async function removeRecord() {
  const title = String(data.value?.record?.[definition.value.displayField] || 'this record')
  if (!window.confirm(`Delete ${title}? This cannot be undone.`)) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await $fetch(`/api/${props.resource}/${props.recordId}`, { method: 'DELETE' })
    await navigateTo(`/${props.resource}`)
  } catch (caught: unknown) {
    const fetchError = caught as { data?: { data?: { dependencies?: string[] } }; statusMessage?: string; message?: string }
    const dependencies = fetchError.data?.data?.dependencies
    deleteMessage.value = dependencies?.length
      ? `Delete blocked. Remove these dependent records first: ${dependencies.join(', ')}.`
      : fetchError.statusMessage || fetchError.message || 'The record could not be deleted.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section>
    <PageHeading :title="definition.singular" :back-to="`/${resource}`" :action-to="`/${resource}/${recordId}/edit`" action-label="Edit record" />
    <p v-if="status === 'pending'" class="loading-message">Loading record…</p>
    <div v-else-if="error" class="notice error-message" role="alert">
      {{ error.statusCode === 404 ? 'This record no longer exists.' : error.statusMessage || 'The record could not be loaded.' }}
    </div>
    <template v-else-if="data">
      <p v-if="deleteMessage" class="notice error-message" role="alert">{{ deleteMessage }}</p>
      <div class="detail-panel">
        <dl class="detail-list">
          <template v-for="field in definition.fields" :key="field.key">
            <dt>{{ field.label }}</dt>
            <dd><RecordValue :field="field" :value="data.record[field.key]" :record="data.record" /></dd>
          </template>
        </dl>
        <div class="detail-actions">
          <NuxtLink class="button secondary" :to="`/${resource}/${recordId}/edit`">Edit record</NuxtLink>
          <button class="button danger" type="button" :disabled="deleting" @click="removeRecord">{{ deleting ? 'Deleting…' : 'Delete record' }}</button>
        </div>
      </div>

      <section v-for="group in data.related" :key="group.label" class="related-section">
        <h2>{{ group.label }}</h2>
        <p v-if="!group.items.length" class="muted">No related {{ group.label.toLowerCase() }}.</p>
        <ul v-else class="related-list">
          <li v-for="item in group.items" :key="String(item.id)">
            <NuxtLink :to="`/${group.resource}/${item.id}`">{{ item.title }}</NuxtLink>
            <span v-if="item.secondary" class="muted"> — {{ item.secondary }}</span>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
