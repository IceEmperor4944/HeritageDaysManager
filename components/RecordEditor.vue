<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'
import { getOptions, getResource as loadResource, ResourceServiceError } from '~/services/resources'

const props = defineProps<{ resource: ResourceKey; recordId?: string | number }>()

const definition = computed(() => getResource(props.resource))
const recordData = ref<{ record: Record<string, unknown> } | null>(null)
const recordStatus = ref<'pending' | 'success' | 'error'>('pending')
const loadError = ref('')
const contactsData = ref<Array<{ id: string | number; label: string }>>([])
const businessesData = ref<Array<{ id: string | number; label: string }>>([])

async function loadFormData() {
  recordStatus.value = 'pending'
  loadError.value = ''
  try {
    const [record, contacts, businesses] = await Promise.all([
      props.recordId ? loadResource(props.resource, props.recordId) : Promise.resolve(null),
      getOptions('contacts'),
      getOptions('businesses'),
    ])
    recordData.value = record
    contactsData.value = contacts
    businessesData.value = businesses
    recordStatus.value = 'success'
  } catch (caught) {
    loadError.value = caught instanceof ResourceServiceError ? caught.message : 'The form could not be loaded.'
    recordStatus.value = 'error'
  }
}

onMounted(loadFormData)
</script>

<template>
  <section>
    <PageHeading :title="recordId ? `Edit ${definition.singular}` : `Add ${definition.singular}`" :back-to="recordId ? `/${resource}/${recordId}` : `/${resource}`" back-label="Back" />
    <p v-if="recordStatus === 'pending'" class="loading-message">Loading record…</p>
    <div v-else-if="loadError" class="notice error-message" role="alert">
      {{ loadError }}
    </div>
    <RecordForm v-else :resource="resource" :record-id="recordId" :initial="recordData?.record" :contacts="contactsData || []" :businesses="businessesData || []" />
  </section>
</template>
