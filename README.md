# Presidential Macroeconomics

Hosted Next.js version of the macro strategy game with:

- compact landing page and conversion funnel
- `/play/setup` scenario ladder
- `/play` interactive run flow
- `/play/results/[runId]` result cards
- `/rankings`, `/teachers`, and `/championship` surfaces
- teacher-managed classroom creation with group join codes and QR links
- school-facing legal pages for privacy, terms, cookies, and school procurement review
- browser persistence for progression
- optional Supabase-backed lead, profile, classroom, and run submission APIs

## Current product direction

The public site is currently being pushed toward a more compact, calmer presentation:

- fewer competing sections above the fold
- shorter copy and clearer hierarchy
- simplified Apple-style pacing rather than dense marketing layouts
- teacher trust surfaces kept visible without dominating the page
- fast access to `Play` and `Teachers` as the two main top-level paths

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the following values:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Teacher class creation, student classroom sign-up, and legal acceptance persistence require Clerk plus Supabase to be configured.

## Database setup

Apply the Supabase migrations before testing the classroom flow:

```bash
supabase db push
```

The classroom and legal-compliance tables are added in [20260409153000_classrooms_and_policies.sql](/Users/ruslanshaymardanov/Desktop/Personal%20info%20and%20tasks/Econ%20IA%20justification/supabase/migrations/20260409153000_classrooms_and_policies.sql).

## Deploy

The project is designed for Vercel. Build locally with:

```bash
npm run build
```

If the repo is already linked to a Vercel project, a production deploy can be triggered with:

```bash
vercel --prod
```
deploy trigger
trigger deploy Mon May 18 16:16:26 +05 2026
