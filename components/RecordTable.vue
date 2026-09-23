<script setup lang="ts">
import { getResource, type ResourceKey } from '~/shared/resources'

const props = defineProps<{
  resource: ResourceKey
  items: Record<string, unknown>[]
}>()

defineEmits<{ remove: [id: string | number] }>()

const definition = computed(() => getResource(props.resource))
const recordTitle = (item: Record<string, unknown>) => String(item[definition.value.displayField] || `#${item.id}`)
</script>

<template>
  <div class="records-table-wrap">
    <table class="records-table">
      <thead>
        <tr>
          <th v-for="field in definition.fields" :key="field.key" scope="col">{{ field.label }}</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="String(item.id)">
          <td v-for="field in definition.fields" :key="field.key" :data-label="field.label">
            <RecordValue :field="field" :value="item[field.key]" :record="item" />
          </td>
          <td class="record-actions" data-label="Actions">
            <NuxtLink :to="`/${resource}/${item.id}`">View {{ recordTitle(item) }}</NuxtLink>
            <NuxtLink :to="`/${resource}/${item.id}/edit`">Edit</NuxtLink>
            <button type="button" class="button-link danger-link" @click="$emit('remove', item.id as string | number)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="records-cards">
    <article v-for="item in items" :key="String(item.id)" class="record-card">
      <h2><NuxtLink :to="`/${resource}/${item.id}`">{{ recordTitle(item) }}</NuxtLink></h2>
      <dl>
        <template v-for="field in definition.fields" :key="field.key">
          <dt>{{ field.label }}</dt>
          <dd><RecordValue :field="field" :value="item[field.key]" :record="item" /></dd>
        </template>
      </dl>
      <div class="record-actions">
        <NuxtLink :to="`/${resource}/${item.id}/edit`">Edit</NuxtLink>
        <button type="button" class="button-link danger-link" @click="$emit('remove', item.id as string | number)">Delete</button>
      </div>
    </article>
  </div>
</template>
