import { describe, expect, it } from 'vitest'
import { PayloadValidationError, validateResourcePayload } from '../shared/validation'

describe('resource payload validation', () => {
  it('normalizes optional contact text and boolean defaults', () => {
    expect(validateResourcePayload('contacts', { contact_name: '  Jamie Lee  ' })).toEqual({
      contact_name: 'Jamie Lee', contact_number: null, email: null,
      is_sponsor: false, is_volunteer: false, notes: null,
    })
  })

  it('requires both relationships for a vendor', () => {
    expect(() => validateResourcePayload('vendors', {
      confirmation: false, vendor_type: 'Food', payment_amount: 20,
    })).toThrow(PayloadValidationError)
  })

  it('rejects invalid contact details and negative numeric values', () => {
    try {
      validateResourcePayload('vendors', {
        confirmation: true, vendor_type: 'Food', contact_id: 1, business_id: 2,
        payment_amount: -1, booth_width: -2,
      })
      throw new Error('Expected validation to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(PayloadValidationError)
      expect((error as PayloadValidationError).errors).toMatchObject({ payment_amount: expect.any(String), booth_width: expect.any(String) })
    }
  })

  it('stores received dates as UTC ISO timestamps', () => {
    const payload = validateResourcePayload('floats', {
      confirmation: false, float_type: 'Parade entry', contact_id: 1, business_id: 2,
      float_form_received: '2026-07-04T10:30:00-06:00',
    })
    expect(payload.float_form_received).toBe('2026-07-04T16:30:00.000Z')
  })
})
