import { getId } from '~/server/utils/api'
import { getResourceParam } from '~/server/utils/resource-param'
import { deleteResource } from '~/server/services/resources'

export default defineEventHandler(async (event) => {
  await deleteResource(getResourceParam(event), getId(event))
  setResponseStatus(event, 204)
  return null
})
