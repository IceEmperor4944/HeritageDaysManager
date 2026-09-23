import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const schema = readFileSync(resolve('migrations/001_initial_schema.sql'), 'utf8')

describe('initial PostgreSQL schema', () => {
  it('creates the four required tables and restrictive foreign keys', () => {
    for (const table of ['contacts', 'businesses', 'vendors', 'floats']) {
      expect(schema).toContain(`CREATE TABLE ${table}`)
    }
    expect(schema).toMatch(/businesses[\s\S]*contact_id BIGINT NOT NULL REFERENCES contacts\(id\) ON DELETE RESTRICT/)
    expect(schema).toMatch(/vendors[\s\S]*contact_id BIGINT NOT NULL REFERENCES contacts\(id\) ON DELETE RESTRICT/)
    expect(schema).toMatch(/vendors[\s\S]*business_id BIGINT NOT NULL REFERENCES businesses\(id\) ON DELETE RESTRICT/)
    expect(schema).toMatch(/floats[\s\S]*business_id BIGINT NOT NULL REFERENCES businesses\(id\) ON DELETE RESTRICT/)
  })

  it('keeps booth dimensions nullable and payment amounts non-negative', () => {
    expect(schema).toContain('booth_width NUMERIC(10, 2),')
    expect(schema).toContain('booth_length NUMERIC(10, 2),')
    expect(schema).toContain('payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (payment_amount >= 0)')
  })
})
