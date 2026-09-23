<script setup lang="ts">
import { isResourceKey, type ResourceKey } from '~/shared/resources'

const route = useRoute()
const resourceParam = String(route.params.resource)
if (!isResourceKey(resourceParam)) throw createError({ statusCode: 404, statusMessage: 'Unknown record type.' })
const resource: ResourceKey = resourceParam
const recordId = String(route.params.id)
</script>

<template><RecordDetail :resource="resource" :record-id="recordId" /></template>
