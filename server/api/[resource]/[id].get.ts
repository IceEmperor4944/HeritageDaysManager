import { getId } from '~/server/utils/api'
import { getResourceParam } from '~/server/utils/resource-param'
import { getResource } from '~/server/services/resources'

export default defineEventHandler((event) => getResource(getResourceParam(event), getId(event)))
