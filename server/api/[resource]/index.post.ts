import { validateResourcePayload, PayloadValidationError } from '~/shared/validation'
import { getResourceParam } from '~/server/utils/resource-param'
import { createResource } from '~/server/services/resources'

export default defineEventHandler(async (event) => {
  const resource = getResourceParam(event)
  try {
    return await createResource(resource, validateResourcePayload(resource, await readBody(event)))
  } catch (error) {
    if (error instanceof PayloadValidationError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation failed.', data: { errors: error.errors } })
    }
    throw error
  }
})
