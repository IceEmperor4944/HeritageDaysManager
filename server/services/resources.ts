import type { ResourceKey } from '~/shared/resources'
import type { Payload } from '~/shared/validation'
import { query } from '~/server/utils/database'
import type { Pagination } from '~/server/utils/api'

type Row = Record<string, unknown>

export interface ListResponse {
  items: Row[]
  page: number
  pageSize: number
  total: number
}

interface RelatedGroup {
  resource: ResourceKey
  label: string
  items: Array<{ id: string | number; title: string; secondary?: string }>
}

function notFound() {
  throw createError({ statusCode: 404, statusMessage: 'Record not found.' })
}

async function paginated(selectSql: string, countSql: string, values: unknown[], pagination: Pagination): Promise<ListResponse> {
  const limitPosition = values.length + 1
  const offsetPosition = values.length + 2
  const [itemsResult, countResult] = await Promise.all([
    query<Row>(`${selectSql} LIMIT $${limitPosition} OFFSET $${offsetPosition}`, [...values, pagination.pageSize, pagination.offset]),
    query<{ total: string }>(countSql, values),
  ])
  return {
    items: itemsResult.rows,
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: Number(countResult.rows[0]?.total || 0),
  }
}

function buildWhere(clauses: string[]): string {
  return clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
}

export async function listResource(resource: ResourceKey, filters: { search?: string | null; primary?: boolean | null; secondary?: boolean | null }, pagination: Pagination) {
  const values: unknown[] = []
  const clauses: string[] = []
  const param = (value: unknown) => {
    values.push(value)
    return `$${values.length}`
  }

  if (resource === 'contacts') {
    if (filters.search) clauses.push(`c.contact_name ILIKE ${param(`%${filters.search}%`)}`)
    if (filters.primary !== null && filters.primary !== undefined) clauses.push(`c.is_sponsor = ${param(filters.primary)}`)
    if (filters.secondary !== null && filters.secondary !== undefined) clauses.push(`c.is_volunteer = ${param(filters.secondary)}`)
    const where = buildWhere(clauses)
    return paginated(
      `SELECT c.* FROM contacts c${where} ORDER BY c.contact_name ASC, c.id ASC`,
      `SELECT COUNT(*)::text AS total FROM contacts c${where}`,
      values, pagination,
    )
  }

  if (resource === 'businesses') {
    if (filters.search) clauses.push(`(b.business_name ILIKE ${param(`%${filters.search}%`)} OR c.contact_name ILIKE $${values.length})`)
    if (filters.primary !== null && filters.primary !== undefined) clauses.push(`b.attendance_confirmation = ${param(filters.primary)}`)
    const where = buildWhere(clauses)
    return paginated(
      `SELECT b.*, c.contact_name FROM businesses b JOIN contacts c ON c.id = b.contact_id${where} ORDER BY b.business_name ASC, b.id ASC`,
      `SELECT COUNT(*)::text AS total FROM businesses b JOIN contacts c ON c.id = b.contact_id${where}`,
      values, pagination,
    )
  }

  const alias = resource === 'vendors' ? 'v' : 'f'
  const typeField = resource === 'vendors' ? 'vendor_type' : 'float_type'
  if (filters.search) clauses.push(`(c.contact_name ILIKE ${param(`%${filters.search}%`)} OR b.business_name ILIKE $${values.length})`)
  const where = buildWhere(clauses)
  return paginated(
    `SELECT ${alias}.*, c.contact_name, b.business_name FROM ${resource} ${alias} JOIN contacts c ON c.id = ${alias}.contact_id JOIN businesses b ON b.id = ${alias}.business_id${where} ORDER BY ${alias}.${typeField} ASC, ${alias}.id ASC`,
    `SELECT COUNT(*)::text AS total FROM ${resource} ${alias} JOIN contacts c ON c.id = ${alias}.contact_id JOIN businesses b ON b.id = ${alias}.business_id${where}`,
    values, pagination,
  )
}

export async function getOptions(resource: 'contacts' | 'businesses') {
  const column = resource === 'contacts' ? 'contact_name' : 'business_name'
  const result = await query<{ id: string; label: string }>(`SELECT id, ${column} AS label FROM ${resource} ORDER BY ${column} ASC, id ASC`)
  return result.rows
}

export async function getResource(resource: ResourceKey, id: number): Promise<{ record: Row; related: RelatedGroup[] }> {
  if (resource === 'contacts') {
    const result = await query<Row>('SELECT * FROM contacts WHERE id = $1', [id])
    const record = result.rows[0]
    if (!record) notFound()
    const [businesses, vendors, floats] = await Promise.all([
      query<{ id: string; business_name: string; attendance_confirmation: boolean }>('SELECT id, business_name, attendance_confirmation FROM businesses WHERE contact_id = $1 ORDER BY business_name', [id]),
      query<{ id: string; vendor_type: string; business_name: string }>('SELECT v.id, v.vendor_type, b.business_name FROM vendors v JOIN businesses b ON b.id = v.business_id WHERE v.contact_id = $1 ORDER BY v.vendor_type', [id]),
      query<{ id: string; float_type: string; business_name: string }>('SELECT f.id, f.float_type, b.business_name FROM floats f JOIN businesses b ON b.id = f.business_id WHERE f.contact_id = $1 ORDER BY f.float_type', [id]),
    ])
    return {
      record,
      related: [
        { resource: 'businesses', label: 'Businesses', items: businesses.rows.map((row) => ({ id: row.id, title: row.business_name, secondary: row.attendance_confirmation ? 'Attendance confirmed' : 'Attendance not confirmed' })) },
        { resource: 'vendors', label: 'Vendors', items: vendors.rows.map((row) => ({ id: row.id, title: row.vendor_type, secondary: row.business_name })) },
        { resource: 'floats', label: 'Floats', items: floats.rows.map((row) => ({ id: row.id, title: row.float_type, secondary: row.business_name })) },
      ],
    }
  }

  if (resource === 'businesses') {
    const result = await query<Row>('SELECT b.*, c.contact_name FROM businesses b JOIN contacts c ON c.id = b.contact_id WHERE b.id = $1', [id])
    const record = result.rows[0]
    if (!record) notFound()
    const [vendors, floats] = await Promise.all([
      query<{ id: string; vendor_type: string; contact_name: string }>('SELECT v.id, v.vendor_type, c.contact_name FROM vendors v JOIN contacts c ON c.id = v.contact_id WHERE v.business_id = $1 ORDER BY v.vendor_type', [id]),
      query<{ id: string; float_type: string; contact_name: string }>('SELECT f.id, f.float_type, c.contact_name FROM floats f JOIN contacts c ON c.id = f.contact_id WHERE f.business_id = $1 ORDER BY f.float_type', [id]),
    ])
    return {
      record,
      related: [
        { resource: 'vendors', label: 'Vendors', items: vendors.rows.map((row) => ({ id: row.id, title: row.vendor_type, secondary: row.contact_name })) },
        { resource: 'floats', label: 'Floats', items: floats.rows.map((row) => ({ id: row.id, title: row.float_type, secondary: row.contact_name })) },
      ],
    }
  }

  const table = resource === 'vendors' ? 'vendors v' : 'floats f'
  const alias = resource === 'vendors' ? 'v' : 'f'
  const result = await query<Row>(`SELECT ${alias}.*, c.contact_name, b.business_name FROM ${table} JOIN contacts c ON c.id = ${alias}.contact_id JOIN businesses b ON b.id = ${alias}.business_id WHERE ${alias}.id = $1`, [id])
  const record = result.rows[0]
  if (!record) notFound()
  return { record, related: [] }
}

export async function createResource(resource: ResourceKey, payload: Payload) {
  const columns = Object.keys(payload)
  const values = Object.values(payload)
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ')
  try {
    const result = await query<{ id: string }>(`INSERT INTO ${resource} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`, values)
    return getResource(resource, Number(result.rows[0].id))
  } catch (error) {
    throwDatabaseError(error)
  }
}

export async function updateResource(resource: ResourceKey, id: number, payload: Payload) {
  const columns = Object.keys(payload)
  const values = Object.values(payload)
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(', ')
  try {
    const result = await query<{ id: string }>(`UPDATE ${resource} SET ${assignments} WHERE id = $${values.length + 1} RETURNING id`, [...values, id])
    if (!result.rows[0]) notFound()
    return getResource(resource, id)
  } catch (error) {
    throwDatabaseError(error)
  }
}

export async function deleteResource(resource: ResourceKey, id: number) {
  if (resource === 'contacts' || resource === 'businesses') {
    const dependencies = await dependenciesFor(resource, id)
    if (dependencies.length) {
      throw createError({ statusCode: 409, statusMessage: 'Delete blocked: this record has dependent records.', data: { dependencies } })
    }
  }
  try {
    const result = await query(`DELETE FROM ${resource} WHERE id = $1`, [id])
    if (!result.rowCount) notFound()
  } catch (error) {
    throwDatabaseError(error)
  }
}

async function dependenciesFor(resource: 'contacts' | 'businesses', id: number): Promise<string[]> {
  const checks = resource === 'contacts'
    ? [
        ['Businesses', 'SELECT COUNT(*)::int AS count FROM businesses WHERE contact_id = $1'],
        ['Vendors', 'SELECT COUNT(*)::int AS count FROM vendors WHERE contact_id = $1'],
        ['Floats', 'SELECT COUNT(*)::int AS count FROM floats WHERE contact_id = $1'],
      ]
    : [
        ['Vendors', 'SELECT COUNT(*)::int AS count FROM vendors WHERE business_id = $1'],
        ['Floats', 'SELECT COUNT(*)::int AS count FROM floats WHERE business_id = $1'],
      ]
  const results = await Promise.all(checks.map(async ([label, sql]) => ({ label, result: await query<{ count: number }>(sql, [id]) })))
  return results.filter(({ result }) => result.rows[0].count > 0).map(({ label, result }) => `${result.rows[0].count} ${label}`)
}

function throwDatabaseError(error: unknown): never {
  const code = (error as { code?: string })?.code
  if (code === '23503') {
    throw createError({ statusCode: 409, statusMessage: 'A selected Contact or Business does not exist, or this record is still referenced.' })
  }
  throw error
}
