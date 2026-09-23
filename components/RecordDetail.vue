<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'
import { deleteResource, getResource as loadResource, ResourceServiceError, type RelatedGroup } from '~/services/resources'

const props = defineProps<{ resource: ResourceKey; recordId: string | number }>()
const definition = computed(() => getResource(props.resource))
const data = ref<{ record: Record<string, unknown>; related: RelatedGroup[] } | null>(null)
const status = ref<'pending' | 'success' | 'error'>('pending')
const error = ref<ResourceServiceError | null>(null)
const deleteMessage = ref('')
const deleting = ref(false)

async function refresh() {
  status.value = 'pending'
  error.value = null
  try {
    data.value = await loadResource(props.resource, props.recordId)
    status.value = 'success'
  } catch (caught) {
    error.value = caught instanceof ResourceServiceError ? caught : new ResourceServiceError('The record could not be loaded.')
    status.value = 'error'
  }
}

onMounted(refresh)
watch(() => [props.resource, props.recordId] as const, refresh)

async function removeRecord() {
  const title = String(data.value?.record?.[definition.value.displayField] || 'this record')
  if (!window.confirm(`Delete ${title}? This cannot be undone.`)) return
  deleteMessage.value = ''
  deleting.value = true
  try {
    await deleteResource(props.resource, props.recordId)
    await navigateTo(`/${props.resource}`)
  } catch (caught: unknown) {
    const serviceError = caught instanceof ResourceServiceError ? caught : null
    deleteMessage.value = serviceError?.dependencies?.length
      ? `Delete blocked. Remove these dependent records first: ${serviceError.dependencies.join(', ')}.`
      : serviceError?.message || (caught instanceof Error ? caught.message : 'The record could not be deleted.')
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
      {{ error.statusCode === 404 ? 'This record no longer exists.' : error.message || 'The record could not be loaded.' }}
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
