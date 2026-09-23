import { getPagination, queryBoolean, queryText } from '~/server/utils/api'
import { getResourceParam } from '~/server/utils/resource-param'
import { listResource } from '~/server/services/resources'

export default defineEventHandler((event) => {
  const resource = getResourceParam(event)
  return listResource(resource, {
    search: queryText(event),
    primary: queryBoolean(event, resource === 'contacts' ? 'is_sponsor' : 'attendance_confirmation'),
    secondary: resource === 'contacts' ? queryBoolean(event, 'is_volunteer') : null,
  }, getPagination(event))
})
