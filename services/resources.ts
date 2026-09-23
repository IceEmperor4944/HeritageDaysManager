import type { ResourceKey } from '~/shared/resources'
import { PayloadValidationError, validateResourcePayload, type Payload } from '~/shared/validation'
import { useSupabase } from '~/composables/useSupabase'

type Row = Record<string, unknown>

export interface ListResponse {
  items: Row[]
  page: number
  pageSize: number
  total: number
}

export interface RelatedGroup {
  resource: ResourceKey
  label: string
  items: Array<{ id: string | number; title: string; secondary?: string }>
}

export class ResourceServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly dependencies?: string[],
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ResourceServiceError'
  }
}

const listTables: Record<ResourceKey, string> = {
  contacts: 'contacts',
  businesses: 'business_resource_rows',
  vendors: 'vendor_resource_rows',
  floats: 'float_resource_rows',
}

const orderFields: Record<ResourceKey, string> = {
  contacts: 'contact_name',
  businesses: 'business_name',
  vendors: 'vendor_type',
  floats: 'float_type',
}

function throwDatabaseError(error: { code?: string; message?: string }): never {
  if (error.code === '23503') {
    throw new ResourceServiceError('A selected Contact or Business does not exist, or this record is still referenced.', 409)
  }
  if (error.code === '42501' || error.code === 'PGRST301') {
    throw new ResourceServiceError('Your account is not allowed to access this data. Sign in again or contact the application administrator.', 403)
  }
  throw new ResourceServiceError(error.message || 'The database request failed.')
}

function unwrap<T>(result: { data: T | null; error: { code?: string; message?: string } | null }): T {
  if (result.error) throwDatabaseError(result.error)
  if (result.data === null) throw new ResourceServiceError('The requested record was not found.', 404)
  return result.data
}

function cleanSearch(value: string): string {
  // The value is inserted into a PostgREST .or() expression. Remove its grammar
  // characters so a search term can never add filters to that expression.
  return value.replace(/[(),."\\%_*]/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function listResource(
  resource: ResourceKey,
  filters: { search?: string | null; primary?: boolean | null; secondary?: boolean | null },
  pagination: { page: number; pageSize: number; offset: number },
): Promise<ListResponse> {
  const supabase = useSupabase()
  let query = supabase.from(listTables[resource]).select('*', { count: 'exact' })
  const search = filters.search ? cleanSearch(filters.search) : ''

  if (search) {
    const pattern = `%${search}%`
    const fields = resource === 'contacts'
      ? ['contact_name']
      : resource === 'businesses'
        ? ['business_name', 'contact_name']
        : ['contact_name', 'business_name']
    query = fields.length === 1
      ? query.ilike(fields[0], pattern)
      : query.or(fields.map((field) => `${field}.ilike.${pattern}`).join(','))
  }

  if (resource === 'contacts') {
    if (filters.primary !== null && filters.primary !== undefined) query = query.eq('is_sponsor', filters.primary)
    if (filters.secondary !== null && filters.secondary !== undefined) query = query.eq('is_volunteer', filters.secondary)
  } else if (resource === 'businesses' && filters.primary !== null && filters.primary !== undefined) {
    query = query.eq('attendance_confirmation', filters.primary)
  }

  const { data, error, count } = await query
    .order(orderFields[resource], { ascending: true })
    .order('id', { ascending: true })
    .range(pagination.offset, pagination.offset + pagination.pageSize - 1)
  if (error) throwDatabaseError(error)
  return {
    items: (data || []) as Row[],
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: count || 0,
  }
}

export async function getOptions(resource: 'contacts' | 'businesses') {
  const supabase = useSupabase()
  const column = resource === 'contacts' ? 'contact_name' : 'business_name'
  const { data, error } = await supabase.from(resource).select(`id, label:${column}`).order(column).order('id')
  if (error) throwDatabaseError(error)
  return (data || []) as Array<{ id: string | number; label: string }>
}

export async function getResource(resource: ResourceKey, id: number | string): Promise<{ record: Row; related: RelatedGroup[] }> {
  const supabase = useSupabase()
  const recordId = Number(id)
  if (!Number.isSafeInteger(recordId) || recordId < 1) throw new ResourceServiceError('Invalid record ID.', 400)

  if (resource === 'contacts') {
    const recordResult = await supabase.from('contacts').select('*').eq('id', recordId).maybeSingle()
    const record = unwrap(recordResult) as Row
    const [businesses, vendors, floats] = await Promise.all([
      supabase.from('businesses').select('id, business_name, attendance_confirmation').eq('contact_id', recordId).order('business_name'),
      supabase.from('vendors').select('id, vendor_type, businesses(business_name)').eq('contact_id', recordId).order('vendor_type'),
      supabase.from('floats').select('id, float_type, businesses(business_name)').eq('contact_id', recordId).order('float_type'),
    ])
    if (businesses.error) throwDatabaseError(businesses.error)
    if (vendors.error) throwDatabaseError(vendors.error)
    if (floats.error) throwDatabaseError(floats.error)
    return {
      record,
      related: [
        { resource: 'businesses', label: 'Businesses', items: (businesses.data || []).map((row: any) => ({ id: row.id, title: row.business_name, secondary: row.attendance_confirmation ? 'Attendance confirmed' : 'Attendance not confirmed' })) },
        { resource: 'vendors', label: 'Vendors', items: (vendors.data || []).map((row: any) => ({ id: row.id, title: row.vendor_type, secondary: row.businesses?.business_name })) },
        { resource: 'floats', label: 'Floats', items: (floats.data || []).map((row: any) => ({ id: row.id, title: row.float_type, secondary: row.businesses?.business_name })) },
      ],
    }
  }

  if (resource === 'businesses') {
    const recordResult = await supabase.from('business_resource_rows').select('*').eq('id', recordId).maybeSingle()
    const record = unwrap(recordResult) as Row
    const [vendors, floats] = await Promise.all([
      supabase.from('vendors').select('id, vendor_type, contacts(contact_name)').eq('business_id', recordId).order('vendor_type'),
      supabase.from('floats').select('id, float_type, contacts(contact_name)').eq('business_id', recordId).order('float_type'),
    ])
    if (vendors.error) throwDatabaseError(vendors.error)
    if (floats.error) throwDatabaseError(floats.error)
    return {
      record,
      related: [
        { resource: 'vendors', label: 'Vendors', items: (vendors.data || []).map((row: any) => ({ id: row.id, title: row.vendor_type, secondary: row.contacts?.contact_name })) },
        { resource: 'floats', label: 'Floats', items: (floats.data || []).map((row: any) => ({ id: row.id, title: row.float_type, secondary: row.contacts?.contact_name })) },
      ],
    }
  }

  const table = resource === 'vendors' ? 'vendor_resource_rows' : 'float_resource_rows'
  const recordResult = await supabase.from(table).select('*').eq('id', recordId).maybeSingle()
  return { record: unwrap(recordResult) as Row, related: [] }
}

function validatedPayload(resource: ResourceKey, input: unknown): Payload {
  try {
    return validateResourcePayload(resource, input)
  } catch (error) {
    if (error instanceof PayloadValidationError) {
      throw new ResourceServiceError('Please correct the highlighted fields.', 400, undefined, error.errors)
    }
    throw error
  }
}

export async function createResource(resource: ResourceKey, input: unknown) {
  const supabase = useSupabase()
  const payload = validatedPayload(resource, input)
  const { data, error } = await supabase.from(resource).insert(payload).select('id').single()
  if (error) throwDatabaseError(error)
  return getResource(resource, data.id)
}

export async function updateResource(resource: ResourceKey, id: number | string, input: unknown) {
  const supabase = useSupabase()
  const payload = validatedPayload(resource, input)
  const { data, error } = await supabase.from(resource).update(payload).eq('id', Number(id)).select('id').maybeSingle()
  if (error) throwDatabaseError(error)
  if (!data) throw new ResourceServiceError('The requested record was not found.', 404)
  return getResource(resource, data.id)
}

export async function deleteResource(resource: ResourceKey, id: number | string) {
  const supabase = useSupabase()
  const recordId = Number(id)
  if (!Number.isSafeInteger(recordId) || recordId < 1) throw new ResourceServiceError('Invalid record ID.', 400)

  if (resource === 'contacts' || resource === 'businesses') {
    const checks = resource === 'contacts'
      ? [
          ['Businesses', 'businesses', 'contact_id'],
          ['Vendors', 'vendors', 'contact_id'],
          ['Floats', 'floats', 'contact_id'],
        ]
      : [
          ['Vendors', 'vendors', 'business_id'],
          ['Floats', 'floats', 'business_id'],
        ]
    const results = await Promise.all(checks.map(async ([label, table, column]) => {
      const result = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, recordId)
      if (result.error) throwDatabaseError(result.error)
      return { label, count: result.count || 0 }
    }))
    const dependencies = results.filter((result) => result.count > 0).map((result) => `${result.count} ${result.label}`)
    if (dependencies.length) {
      throw new ResourceServiceError('Delete blocked: this record has dependent records.', 409, dependencies)
    }
  }

  const { data, error } = await supabase.from(resource).delete().eq('id', recordId).select('id').maybeSingle()
  if (error) throwDatabaseError(error)
  if (!data) throw new ResourceServiceError('The requested record was not found.', 404)
}
