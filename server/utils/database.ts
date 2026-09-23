import { Pool, type QueryResultRow } from 'pg'

let pool: Pool | undefined

export function getDatabase() {
  if (pool) return pool
  const { databaseUrl } = useRuntimeConfig()
  if (!databaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL is not configured.' })
  }
  pool = new Pool({ connectionString: databaseUrl })
  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getDatabase().query<T>(text, values)
}
