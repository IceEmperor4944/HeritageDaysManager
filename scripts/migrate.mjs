import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const { Client } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL must be set before running migrations.')
  process.exitCode = 1
} else {
  const migrationsDirectory = resolve('migrations')
  const migrations = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort()
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())')
    await client.query('REVOKE ALL ON TABLE schema_migrations FROM anon, authenticated')
    for (const migrationName of migrations) {
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [migrationName])
      if (applied.rowCount) {
        console.log(`${migrationName} has already been applied.`)
        continue
      }
      const migration = await readFile(resolve(migrationsDirectory, migrationName), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(migration)
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [migrationName])
        await client.query('COMMIT')
        console.log(`Applied migrations/${migrationName}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.end()
  }
}
