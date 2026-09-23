<script setup lang="ts">
import { getResource, isResourceKey, type ResourceKey } from '~/shared/resources'

const route = useRoute()
const routeResource = String(route.params.resource)
if (!isResourceKey(routeResource)) {
  throw createError({ statusCode: 404, statusMessage: 'Unknown record type.' })
}
const resource: ResourceKey = routeResource
const definition = getResource(resource)
const filters = reactive({ search: '', primary: '', secondary: '' })
const page = ref(1)
const deleteMessage = ref('')
const deletingId = ref<string | number | null>(null)

const requestQuery = computed(() => {
  const query: Record<string, string | number> = { page: page.value, pageSize: 25 }
  if (filters.search.trim()) query.search = filters.search.trim()
  if (resource === 'contacts') {
    if (filters.primary) query.is_sponsor = filters.primary
    if (filters.secondary) query.is_volunteer = filters.secondary
  }
  if (resource === 'businesses' && filters.primary) query.attendance_confirmation = filters.primary
  return query
})

const { data, status, error, refresh } = await useFetch<{ items: Record<string, unknown>[]; page: number; pageSize: number; total: number }>(`/api/${resource}`, {
  query: requestQuery,
  watch: false,
})

const items = computed(() => data.value?.items || [])
const total = computed(() => data.value?.total || 0)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / 25)))

async function applyFilters() {
  page.value = 1
  await refresh()
}

async function clearFilters() {
  filters.search = ''
  filters.primary = ''
  filters.secondary = ''
  page.value = 1
  await refresh()
}

async function goToPage(nextPage: number) {
  page.value = Math.min(Math.max(1, nextPage), pageCount.value)
  await refresh()
}

async function deleteRecord(id: string | number) {
  const item = items.value.find((record: Record<string, unknown>) => String(record.id) === String(id))
  const name = String(item?.[definition.displayField] || 'this record')
  if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
  deleteMessage.value = ''
  deletingId.value = id
  try {
    await $fetch(`/api/${resource}/${id}`, { method: 'DELETE' })
    if (items.value.length === 1 && page.value > 1) page.value -= 1
    await refresh()
  } catch (caught: unknown) {
    const fetchError = caught as { data?: { data?: { dependencies?: string[] } }; statusMessage?: string; message?: string }
    const dependencies = fetchError.data?.data?.dependencies
    deleteMessage.value = dependencies?.length
      ? `Delete blocked. Remove these dependent records first: ${dependencies.join(', ')}.`
      : fetchError.statusMessage || fetchError.message || 'The record could not be deleted.'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <section>
    <PageHeading :title="definition.plural" :action-to="`/${resource}/new`" :action-label="`Add ${definition.singular}`" />
    <form class="filter-bar" @submit.prevent="applyFilters">
      <div class="filter-field search-field">
        <label for="search">{{ resource === 'contacts' ? 'Contact name' : resource === 'businesses' ? 'Business or Contact name' : 'Contact or Business name' }}</label>
        <input id="search" v-model="filters.search" type="search" placeholder="Search by name">
      </div>
      <div v-if="resource === 'contacts'" class="filter-field">
        <label for="primary-filter">Is Sponsor</label>
        <select id="primary-filter" v-model="filters.primary">
          <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
        </select>
      </div>
      <div v-if="resource === 'contacts'" class="filter-field">
        <label for="secondary-filter">Is Volunteer</label>
        <select id="secondary-filter" v-model="filters.secondary">
          <option value="">All</option><option value="true">Yes</option><option value="false">No</option>
        </select>
      </div>
      <div v-if="resource === 'businesses'" class="filter-field">
        <label for="primary-filter">Attendance Confirmation</label>
        <select id="primary-filter" v-model="filters.primary">
          <option value="">All</option><option value="true">Confirmed</option><option value="false">Not confirmed</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="button primary" type="submit">Filter</button>
        <button class="button secondary" type="button" @click="clearFilters">Clear</button>
      </div>
    </form>

    <p v-if="deleteMessage" class="notice error-message" role="alert">{{ deleteMessage }}</p>
    <p v-if="status === 'pending'" class="loading-message">Loading {{ definition.plural.toLowerCase() }}…</p>
    <div v-else-if="error" class="notice error-message" role="alert">{{ error.statusMessage || `The ${definition.plural.toLowerCase()} could not be loaded.` }}</div>
    <div v-else-if="!items.length" class="empty-state">
      <h2>No {{ definition.plural.toLowerCase() }} found</h2>
      <p>Adjust the filters or add a {{ definition.singular.toLowerCase() }} to get started.</p>
    </div>
    <template v-else>
      <p class="result-count">{{ total }} {{ total === 1 ? definition.singular.toLowerCase() : definition.plural.toLowerCase() }}</p>
      <RecordTable :resource="resource" :items="items" @remove="deleteRecord" />
      <nav v-if="pageCount > 1" class="pagination" aria-label="Pagination">
        <button class="button secondary" type="button" :disabled="page <= 1 || deletingId !== null" @click="goToPage(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pageCount }}</span>
        <button class="button secondary" type="button" :disabled="page >= pageCount || deletingId !== null" @click="goToPage(page + 1)">Next</button>
      </nav>
    </template>
  </section>
</template>
