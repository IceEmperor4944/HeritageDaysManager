# Heritage Days Manager

A static Nuxt 3 application for managing Heritage Days Contacts, Businesses, Vendors, and Floats. GitHub Pages hosts the frontend; Supabase provides PostgreSQL, the REST API, and sign-in.

## Set up Supabase

1. Create a Supabase project.
2. Apply `migrations/001_initial_schema.sql` and then `migrations/002_supabase_access.sql` in the Supabase SQL Editor. Alternatively, set `DATABASE_URL` in `.env` to the project's PostgreSQL connection string and run `npm run db:migrate`.
3. In Supabase Authentication settings, disable new user signups. Create a user for each person who should use the manager.
4. Copy the Project URL and anon/publishable key from the Supabase API settings.

The second migration enables row-level security, gives database access only to signed-in users, and creates read-only views used for joined searches. The browser uses only Supabase's public anon/publishable key. Never put a database password or Supabase service-role/secret key in the site configuration.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Start the application with `npm run dev` and sign in with a Supabase user.

## Deploy to GitHub Pages

1. In the GitHub repository, open **Settings → Pages** and set the source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `NUXT_PUBLIC_SUPABASE_URL` — the Supabase Project URL.
   - `NUXT_PUBLIC_SUPABASE_ANON_KEY` — the Supabase anon/publishable key.
3. Push to `master` or run the **Deploy to GitHub Pages** workflow manually.

The workflow runs `nuxt generate`, sets the correct GitHub Pages base path, and publishes `.output/public`. Nuxt's static fallback pages keep dynamic record detail and edit links working when a page is refreshed directly.

## Commands

- `npm run dev` — start the local development server.
- `npm run generate` — generate the GitHub Pages static site.
- `npm run db:migrate` — apply numbered SQL migrations using `DATABASE_URL`.
- `npm run typecheck` — type-check Nuxt and Vue code.
- `npm run test` — run schema and payload-validation tests.
- `npm run build` — create a server build for hosting on a Node server instead of GitHub Pages.
