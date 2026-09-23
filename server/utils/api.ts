import type { H3Event } from 'h3'
import { PayloadValidationError } from '~/shared/validation'

export interface Pagination {
  page: number
  pageSize: number
  offset: number
}

export function getId(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid record ID.' })
  }
  return id
}

export function getPagination(event: H3Event): Pagination {
  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1)
  const requestedPageSize = Number.parseInt(String(query.pageSize || '25'), 10) || 25
  const pageSize = Math.min(100, Math.max(1, requestedPageSize))
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function queryText(event: H3Event, key = 'search'): string | null {
  const value = getQuery(event)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function queryBoolean(event: H3Event, key: string): boolean | null {
  const value = getQuery(event)[key]
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function rethrowValidation(error: unknown): never | void {
  if (error instanceof PayloadValidationError) {
    throw createError({ statusCode: 400, statusMessage: 'Validation failed.', data: { errors: error.errors } })
  }
}

export function databaseFailure(error: unknown): never {
  const code = (error as { code?: string })?.code
  if (code === '23503') {
    throw createError({ statusCode: 409, statusMessage: 'This record is still used by another record.' })
  }
  throw error
}
