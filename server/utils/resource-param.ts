import type { H3Event } from 'h3'
import { isResourceKey, type ResourceKey } from '~/shared/resources'

export function getResourceParam(event: H3Event): ResourceKey {
  const resource = getRouterParam(event, 'resource')
  if (!resource || !isResourceKey(resource)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown record type.' })
  }
  return resource
}
