import type { ResourceKey } from './resources'

export type Payload = Record<string, string | number | boolean | null>

export class PayloadValidationError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    super('Validation failed')
  }
}

function inputObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PayloadValidationError({ body: 'A JSON object is required.' })
  }
  return input as Record<string, unknown>
}

function requiredText(input: Record<string, unknown>, key: string, errors: Record<string, string>): string {
  const value = input[key]
  if (typeof value !== 'string' || !value.trim()) {
    errors[key] = 'This field is required.'
    return ''
  }
  return value.trim()
}

function optionalText(input: Record<string, unknown>, key: string): string | null {
  const value = input[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function optionalBoolean(input: Record<string, unknown>, key: string, errors: Record<string, string>): boolean {
  const value = input[key]
  if (value === undefined) return false
  if (typeof value !== 'boolean') {
    errors[key] = 'Must be true or false.'
    return false
  }
  return value
}

function requiredId(input: Record<string, unknown>, key: string, errors: Record<string, string>): number {
  const value = input[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    errors[key] = 'A valid record must be selected.'
    return 0
  }
  return parsed
}

function optionalDate(input: Record<string, unknown>, key: string, errors: Record<string, string>): string | null {
  const value = input[key]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    errors[key] = 'Enter a valid date and time.'
    return null
  }
  return new Date(value).toISOString()
}

function optionalNonNegativeNumber(input: Record<string, unknown>, key: string, errors: Record<string, string>): number | null {
  const value = input[key]
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    errors[key] = 'Enter a non-negative number.'
    return null
  }
  return value
}

function requiredNonNegativeNumber(input: Record<string, unknown>, key: string, errors: Record<string, string>): number {
  const value = input[key]
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    errors[key] = 'Enter a non-negative amount.'
    return 0
  }
  return value
}

export function validateResourcePayload(resource: ResourceKey, rawInput: unknown): Payload {
  const input = inputObject(rawInput)
  const errors: Record<string, string> = {}
  let payload: Payload

  if (resource === 'contacts') {
    const email = optionalText(input, 'email')
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address.'
    payload = {
      contact_name: requiredText(input, 'contact_name', errors),
      contact_number: optionalText(input, 'contact_number'), email,
      is_sponsor: optionalBoolean(input, 'is_sponsor', errors),
      is_volunteer: optionalBoolean(input, 'is_volunteer', errors),
      notes: optionalText(input, 'notes'),
    }
  } else if (resource === 'businesses') {
    payload = {
      business_name: requiredText(input, 'business_name', errors),
      contact_id: requiredId(input, 'contact_id', errors),
      attendance_confirmation: optionalBoolean(input, 'attendance_confirmation', errors),
      description: optionalText(input, 'description'), notes: optionalText(input, 'notes'),
    }
  } else if (resource === 'vendors') {
    payload = {
      confirmation: optionalBoolean(input, 'confirmation', errors),
      vendor_type: requiredText(input, 'vendor_type', errors),
      description: optionalText(input, 'description'),
      contact_id: requiredId(input, 'contact_id', errors),
      business_id: requiredId(input, 'business_id', errors),
      date_form_received: optionalDate(input, 'date_form_received', errors),
      booth_width: optionalNonNegativeNumber(input, 'booth_width', errors),
      booth_length: optionalNonNegativeNumber(input, 'booth_length', errors),
      payment_amount: requiredNonNegativeNumber(input, 'payment_amount', errors),
      payment_detail: optionalText(input, 'payment_detail'), notes: optionalText(input, 'notes'),
    }
  } else {
    payload = {
      confirmation: optionalBoolean(input, 'confirmation', errors),
      float_type: requiredText(input, 'float_type', errors),
      contact_id: requiredId(input, 'contact_id', errors),
      business_id: requiredId(input, 'business_id', errors),
      float_form_received: optionalDate(input, 'float_form_received', errors),
      notes: optionalText(input, 'notes'),
    }
  }

  if (Object.keys(errors).length) throw new PayloadValidationError(errors)
  return payload
}
