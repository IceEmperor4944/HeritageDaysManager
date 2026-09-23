# Heritage Days Database Manager

The application is a Nuxt-based administrative website for viewing and managing the Heritage Days PostgreSQL records. It provides create, read, update, and delete operations for contacts, businesses, vendors, and floats.

## Core behavior

- Contacts, Businesses, Vendors, and Floats have list, detail, create, and edit pages.
- Required relationships are enforced in PostgreSQL and displayed as links in the website.
- Contacts filter by sponsor and volunteer status. Businesses filter by attendance confirmation. Vendors and Floats filter on linked contact or business name.
- Referenced Contacts and Businesses cannot be deleted until their dependent records are removed.

## Technical design

- Nuxt renders the responsive HTML interface and exposes server-side API endpoints.
- PostgreSQL stores application data. `migrations/001_initial_schema.sql` provisions the schema.
- The server reads `DATABASE_URL` from its private runtime configuration; no database credentials reach the browser.
