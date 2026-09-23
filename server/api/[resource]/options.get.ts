import { getResourceParam } from '~/server/utils/resource-param'
import { getOptions } from '~/server/services/resources'

export default defineEventHandler((event) => {
  const resource = getResourceParam(event)
  if (resource !== 'contacts' && resource !== 'businesses') {
    throw createError({ statusCode: 404, statusMessage: 'Options are only available for Contacts and Businesses.' })
  }
  return getOptions(resource)
})
