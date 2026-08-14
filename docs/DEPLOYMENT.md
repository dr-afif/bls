# Deployment

## Overview

- Frontend source: GitHub
- Frontend build: GitHub Actions
- Frontend hosting: GitHub Pages
- Backend: Supabase
- Optional custom domain
- Optional future migration to Cloudflare Pages

## Environments

Recommended:

- Local
- Staging
- Production

Each remote environment should use a separate Supabase project.

## Frontend environment variables

Safe for public frontend builds:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Do not expose:

```text
SUPABASE_SECRET_KEY
service_role key
database password
email-provider credentials
certificate secrets
```

Copy `.env.example` to `.env.local` for local development. Configure the same
two public values in the frontend build environment. The publishable key is
designed for browser use with RLS; it is not a substitute for database
policies. Never prefix secret or service-role credentials with `VITE_`.

For Auth redirects, allow the deployed GitHub Pages URL and local Vite URL in
the Supabase Auth URL configuration. The application uses hash routing and a
PKCE callback at `/#/auth/callback`.

## GitHub Actions

The repository deploys the Vite `dist` output through
`.github/workflows/deploy-pages.yml`. Configure these GitHub Actions repository
variables before running the workflow:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

The workflow fails closed when either public value is missing. GitHub Pages
uses the `/bls/` Vite base path and hash-based application routes.

Recommended workflows:

### Continuous integration

Runs on pull requests:

- Install dependencies
- Typecheck
- Lint
- Unit tests
- Component tests
- Production build
- Selected end-to-end smoke tests

### GitHub Pages deployment

Runs on protected main-branch changes after CI success:

- Build application
- Set correct Vite base path
- Generate SPA fallback if using browser routing
- Upload Pages artifact
- Deploy

## GitHub Pages routing

Options:

### Hash routing

Most reliable:

```text
https://example.github.io/bls-learning/#/app/dashboard
```

### Browser routing

Requires:

- Correct Vite `base`
- Generated `404.html`
- Redirect and route-restoration logic

Use a custom domain where practical for a cleaner production experience.

## Supabase deployment

Recommended process:

1. Develop locally.
2. Create migration.
3. Rebuild local database.
4. Run SQL and RLS tests.
5. Review migration.
6. Apply to staging.
7. Run staging smoke tests.
8. Apply to production.
9. Verify production.
10. Record release.

## Edge Functions

Deploy separately from the static frontend.

Functions may include:

- `invite-user`
- `manage-user`
- `issue-resource-access`
- `generate-certificate`
- `export-analytics`

Store function secrets in Supabase secret management.

Milestone 4 Phase 2 deploys `issue-resource-access` with platform JWT
verification enabled and `@supabase/server` user authentication. It returns
only 60-second signed URLs after service-side authorization and uses
`Cache-Control: no-store, private`. Deploy it separately with:

```bash
npx supabase functions deploy issue-resource-access --use-api
```

## Storage

Recommended buckets:

- `course-resources` — private; PDF-only, 20 MiB maximum, no browser read/list
  policy
- `course-images` — private or public depending on content
- `question-media` — private
- `certificates` — private
- `public-branding` — public if appropriate

The repository declares the fictional private-PDF fixture paths under
`storage.buckets.course-resources`. Seed only a linked fictional development
project with `npx supabase seed buckets --linked`; do not seed clinical or
real-user documents from the repository.

## Domain and security headers

GitHub Pages has limited header configuration.

Use application-level protections where possible. A future move to Cloudflare Pages may provide more control over routing and response headers.

## Release checklist

- CI green
- Database migration reviewed
- RLS tests green
- No secrets in repository
- Build uses production Supabase URL and publishable key
- Protected buckets private
- Edge Functions deployed
- Smoke tests completed
- Version updated
- Changelog updated
- Rollback plan documented

## Rollback

Frontend:

- Redeploy a prior known-good build.

Database:

- Prefer forward-fix migrations.
- Keep backups.
- Avoid irreversible destructive migrations.
- Test restoration procedures.
- Preserve historical assessment records.

## Monitoring

Recommended monitoring areas:

- Frontend runtime errors
- Edge Function errors
- Auth failures
- Database latency
- Storage failures
- Quiz submission failures
- Resource-token failures
- Certificate-generation failures

Do not include sensitive answers, tokens, or signed URLs in monitoring payloads.
