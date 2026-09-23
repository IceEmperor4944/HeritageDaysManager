# Heritage Days Manager

A Nuxt 3 administrative website for managing Heritage Days Contacts, Businesses, Vendors, and Floats in PostgreSQL.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you created.
3. Apply the schema with `npm run db:migrate`.
4. Start the website with `npm run dev`.

Open the local URL printed by Nuxt. The application has no authentication in this version.

## Commands

- `npm run dev` — start the development server.
- `npm run db:migrate` — apply the initial PostgreSQL schema.
- `npm run test` — run schema and payload-validation tests.
- `npm run typecheck` — type-check Nuxt and Vue code.
- `npm run build` — create a production build.

## Database behavior

The migration uses `ON DELETE RESTRICT` for all relationships. The API pre-checks dependent rows and returns HTTP 409 when a Contact or Business cannot be deleted. PostgreSQL foreign keys remain the final protection against invalid or concurrent writes.
