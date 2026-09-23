# Heritage Days Database Manager Design Plan

## Summary

Create `DATABASE_WEBSITE_DESIGN_PLAN.md` describing a Nuxt application with HTML/CSS/Vue pages, Nuxt server API routes, and PostgreSQL. The v1 supports full CRUD for Contacts, Businesses, Vendors, and Floats without authentication.

## Data Model and API

- Use PostgreSQL tables `contacts`, `businesses`, `vendors`, and `floats`, each with an identity primary key.
- Require the declared relationship fields:
  - `businesses.contact_id → contacts.id`
  - `vendors.contact_id → contacts.id`, `vendors.business_id → businesses.id`
  - `floats.contact_id → contacts.id`, `floats.business_id → businesses.id`
- Block deletion of a Contact or Business when dependent rows exist; return a conflict response and show the dependencies in the UI.
- Store booleans as `BOOLEAN NOT NULL DEFAULT false`; use `TIMESTAMPTZ` for received-date fields, `NUMERIC(10,2)` for payment and nullable booth dimensions, and `TEXT` for descriptions/notes.
- Expose consistent JSON endpoints for list, detail, create, update, and delete actions under `/api/contacts`, `/api/businesses`, `/api/vendors`, and `/api/floats`.
- Support `page` and `pageSize` list parameters, returning 25 rows per page by default.

## Pages and Layout

- Provide list, detail, create, and edit pages for every record type.
- Use a simple responsive admin layout: top navigation, page heading with “Add” action, filter row, horizontally scrollable desktop data tables, and card-style mobile rows.
- List pages display every field for their table plus actions for view, edit, and delete.
- List-page filters:
  - Contacts: Contact Name search; Is Sponsor and Is Volunteer tri-state filters.
  - Businesses: Business Name or linked Contact Name search; Attendance Confirmation tri-state filter.
  - Vendors and Floats: one linked Contact-or-Business name search.
- Detail pages show all fields and clear links to every connected Contact and Business. Contacts and Businesses also show related records in linked sections.
- Create/edit pages use dropdown selectors for required Contact and Business links; list pages alone contain free-text search controls.
- Use browser validation plus API validation for required names/types/relationships, valid email input, non-negative payment and booth dimensions, and valid dates. Store dates in UTC and render them in the browser’s local time.

## Nuxt Implementation

- Build pages with Nuxt routes such as `/contacts`, `/contacts/[id]`, `/contacts/new`, and `/contacts/[id]/edit`, mirrored for the other three entities.
- Use Nuxt server routes and a PostgreSQL connection pool; keep database credentials in runtime environment configuration.
- Load list/detail data through `useFetch`; submit create, update, and delete actions with `$fetch`.
- Show loading, empty, validation-error, missing-record, and blocked-delete states. Confirm destructive actions before calling delete.

## Test Plan

- Verify migrations create all fields, foreign keys, defaults, nullability rules, and deletion restrictions.
- Test all CRUD endpoints, including invalid IDs, invalid payloads, relationship failures, and deletion conflicts.
- Test each list filter and pagination, especially Contact sponsor/volunteer filters and Business attendance confirmation.
- Verify every detail page renders its fields and navigates to linked Contact/Business pages.
- Test responsive table/card layouts and keyboard-accessible form, link, and confirmation interactions.

## Assumptions

- `contact_name`, `business_name`, `vendor_type`, and `float_type` are required; communication details, descriptions, notes, received dates, payment detail, and booth dimensions are optional.
- `payment_amount` defaults to `0.00`.
- A Vendor or Float may use a Contact different from the Business’s primary Contact; both links remain required.
- No authentication, audit log, file uploads, or public-facing portal are included in v1.
