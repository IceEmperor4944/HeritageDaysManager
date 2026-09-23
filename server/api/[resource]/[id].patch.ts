import { validateResourcePayload, PayloadValidationError } from '~/shared/validation'
import { getId } from '~/server/utils/api'
import { getResourceParam } from '~/server/utils/resource-param'
import { updateResource } from '~/server/services/resources'

export default defineEventHandler(async (event) => {
  const resource = getResourceParam(event)
  try {
    return await updateResource(resource, getId(event), validateResourcePayload(resource, await readBody(event)))
  } catch (error) {
    if (error instanceof PayloadValidationError) {
      throw createError({ statusCode: 400, statusMessage: 'Validation failed.', data: { errors: error.errors } })
    }
    throw error
  }
})
