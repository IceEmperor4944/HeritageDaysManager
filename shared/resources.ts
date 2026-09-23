export const resourceKeys = ['contacts', 'businesses', 'vendors', 'floats'] as const

export type ResourceKey = (typeof resourceKeys)[number]
export type FieldType = 'text' | 'tel' | 'email' | 'textarea' | 'boolean' | 'datetime' | 'number' | 'currency' | 'relation'

export interface ResourceField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  relation?: 'contacts' | 'businesses'
}

export interface ResourceDefinition {
  key: ResourceKey
  singular: string
  plural: string
  displayField: string
  fields: ResourceField[]
}

export const resources: Record<ResourceKey, ResourceDefinition> = {
  contacts: {
    key: 'contacts', singular: 'Contact', plural: 'Contacts', displayField: 'contact_name',
    fields: [
      { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
      { key: 'contact_number', label: 'Contact Number', type: 'tel' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'is_sponsor', label: 'Is Sponsor', type: 'boolean' },
      { key: 'is_volunteer', label: 'Is Volunteer', type: 'boolean' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  businesses: {
    key: 'businesses', singular: 'Business', plural: 'Businesses', displayField: 'business_name',
    fields: [
      { key: 'business_name', label: 'Business Name', type: 'text', required: true },
      { key: 'contact_id', label: 'Contact', type: 'relation', relation: 'contacts', required: true },
      { key: 'attendance_confirmation', label: 'Attendance Confirmation', type: 'boolean' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  vendors: {
    key: 'vendors', singular: 'Vendor', plural: 'Vendors', displayField: 'vendor_type',
    fields: [
      { key: 'confirmation', label: 'Confirmation', type: 'boolean' },
      { key: 'vendor_type', label: 'Vendor Type', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'contact_id', label: 'Contact', type: 'relation', relation: 'contacts', required: true },
      { key: 'business_id', label: 'Business', type: 'relation', relation: 'businesses', required: true },
      { key: 'date_form_received', label: 'Date Form Received', type: 'datetime' },
      { key: 'booth_width', label: 'Booth Width', type: 'number' },
      { key: 'booth_length', label: 'Booth Length', type: 'number' },
      { key: 'payment_amount', label: 'Payment Amount', type: 'currency', required: true },
      { key: 'payment_detail', label: 'Payment Detail', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  floats: {
    key: 'floats', singular: 'Float', plural: 'Floats', displayField: 'float_type',
    fields: [
      { key: 'confirmation', label: 'Confirmation', type: 'boolean' },
      { key: 'float_type', label: 'Float Type', type: 'text', required: true },
      { key: 'contact_id', label: 'Contact', type: 'relation', relation: 'contacts', required: true },
      { key: 'business_id', label: 'Business', type: 'relation', relation: 'businesses', required: true },
      { key: 'float_form_received', label: 'Float Form Received', type: 'datetime' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
}

export function isResourceKey(value: string): value is ResourceKey {
  return resourceKeys.includes(value as ResourceKey)
}

export function getResource(value: string): ResourceDefinition {
  if (!isResourceKey(value)) {
    throw new Error(`Unknown resource: ${value}`)
  }
  return resources[value]
}
