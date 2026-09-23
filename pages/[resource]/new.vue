<script setup lang="ts">
import { isResourceKey, type ResourceKey } from '~/shared/resources'

const resourceParam = String(useRoute().params.resource)
if (!isResourceKey(resourceParam)) throw createError({ statusCode: 404, statusMessage: 'Unknown record type.' })
const resource: ResourceKey = resourceParam
</script>

<template><RecordEditor :resource="resource" /></template>
