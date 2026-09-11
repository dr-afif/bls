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
https://example.github.io/bls/#/
```

The application uses `createHashRouter` which works out of the box with GitHub Pages subpaths.

### PWA and Service Worker Deployment under GitHub Pages

When building with `GITHUB_PAGES=true`:
- Vite sets `base: "/bls/"`
- `manifest.webmanifest` uses relative URLs (`start_url: "./"`, `scope: "./"`), resolving cleanly to `https://<org>.github.io/bls/`
- Service worker is registered at `/bls/sw.js` with scope `/bls/`
- Static assets and icons (`icon-192.png`, `icon-512.png`, `icon-maskable.png`, `favicon.svg`) resolve under `/bls/`
- Navigation network-first caching allows the offline shell to load while strictly blocking any dynamic or Supabase API responses from cache.

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

Milestone 6 Phase 6.5.2B2A deploys `admin-invite-user` with platform JWT
verification (`verify_jwt = true`). It securely validates administrator authorization,
invites users via TokenHash to `SITE_URL`, transactionally provisions profile/role/audit
via service-role RPC `provision_invited_user`, and compensates failed invitations via
`auth.admin.deleteUser`. Requires runtime secret `SITE_URL=https://dr-afif.github.io/bls/`.
Deploy with:

```bash
npx supabase functions deploy admin-invite-user
```

### Auth email delivery and templates

Phase 6.5.2B2B verifies custom email delivery and template contracts:

- **Custom SMTP**: Enabled using dedicated production Gmail infrastructure (`smtp.gmail.com`, port `465`, SSL, sender name `BLS Course Companion`).
- **Invite User Template**: Configured in Supabase Dashboard (Authentication → Email Templates → Invite user) using repository source `supabase/templates/invite.html`.
  - Subject: `You have been invited to BLS Course Companion`
  - Action link: `<a class="button" href="{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>`
- **Critical Architecture Rule (Template Drift Protection)**:
  The mandatory invitation link contract is:
  ```html
  <a class="button" href="{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>
  ```
  The default Supabase `{{ .ConfirmationURL }}` flow must **never** be restored. Calling `{{ .ConfirmationURL }}` triggers GoTrue server verification that returns an implicit `#access_token=...&refresh_token=...` hash redirect, which breaks React Router `createHashRouter` and exposes tokens in browser history. The TokenHash `verifyOtp` client-side acceptance flow is mandatory. Because the hosted template HTML cannot currently be inspected or deployed via CLI, verifying this template is a mandatory manual release check. Do not attempt to automate template mutation from CI.

### Gmail SMTP operational guidelines

- **Infrastructure**: Custom SMTP currently utilizes dedicated production Gmail infrastructure (`smtp.gmail.com:465`, SSL) with an application-specific password.
- **Custodian Boundary**: SMTP credentials and App Passwords are platform-custodian secrets managed exclusively in Supabase Auth settings. Normal application administrators must never receive access to SMTP credentials or Google account recovery mechanisms.
- **Operating Envelope**: Gmail SMTP is acceptable and cost-effective for current low-volume physical course cohorts. If volume increases or deliverability requires dedicated domain reputation, migration to a dedicated transactional provider (such as Resend or SendGrid) remains straightforward.
- **Architectural Decoupling**: The application authentication and invitation architecture is completely decoupled from Gmail-specific features and relies strictly on standard SMTP and standard GoTrue tokens.
- **Secret Hygiene**: Never record Gmail passwords, Google App Passwords, SMTP passwords, or recovery secrets in repository code, issues, pull requests, or CI logs.

### Production regression test account policy

- **Controlled Regression Probe**: The production test account (`m***@upm.edu.my`) established and verified during Phase 6.5.2B2B is intentionally retained in `active` status as a controlled regression probe.
- **Privilege Boundary**: The account holds strictly the `learner` role, with zero course entitlements, zero cohort memberships, and zero administrative permissions. It is technically incapable of accessing administrative screens or unassigned cohort materials.
- **Lifecycle Management**: Retain this account through Phase 6.5.2 hardening and Phase 6.5.2D Final Production Verification to allow verification of authentication, session restoration, and role isolation on the live deployment without requiring new invitations.
- **Decommissioning**: Do not modify or delete this account automatically. Prior to live physical-course launch with real learners, platform custodians should evaluate whether to suspend or purge the test account.

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

## Production release verification checklist

Release verification is split into **Automated CI** (validated on every pull request and push to `main`) and **Manual Release Checks** (verified on the hosted production environment prior to release sign-off).

### Part 1: Automated CI (GitHub Actions `.github/workflows/ci.yml`)

The automated CI pipeline runs in a clean, non-privileged environment without production credentials:

- [ ] **Clean Dependency Installation**: `npm ci` succeeds cleanly against `package-lock.json`.
- [ ] **TypeScript Typecheck**: `npm run typecheck` (`tsc -b --pretty false`) passes with 0 errors.
- [ ] **ESLint**: `npm run lint` passes with 0 warnings or errors.
- [ ] **Frontend Vitest Suite**: `npm run test -- --run` passes 100% of tests (33 test files / 189 assertions).
- [ ] **Production Build**: `npm run build` succeeds, generating Vite assets in `dist/`.
- [ ] **Migration-from-Zero Verification**: Ephemeral local Supabase starts cleanly (`supabase start`), successfully executing all 28 schema migrations in chronological order from a blank database.
- [ ] **Database Schema Lint**: `supabase db lint --local --schema public` reports 0 schema or typing errors.
- [ ] **Database pgTAP Regression Suite**: `supabase test db` passes 100% of tests across all 13 test files (358 assertions) against the local ephemeral database.
- [ ] **Clean Ephemeral Teardown**: Local Supabase containers stop cleanly (`supabase stop`).

### Part 2: Manual Release Checks (Hosted Infrastructure & Live App)

Hosted Supabase and third-party configurations that cannot be safely tested from unprivileged CI must be manually verified:

- [ ] **Hosted Database Migrations**: Verify all repository migrations are applied remotely via `npx supabase migration list` (confirm 28/28 local and remote are aligned).
- [ ] **Hosted pgTAP Smoke Test**: Run `npx supabase test db --linked` against the hosted project to confirm remote policy enforcement (358/358 passing).
- [ ] **Edge Functions Active**:
  - `admin-invite-user` is ACTIVE (JWT verification enabled, `verify_jwt = true`).
  - `issue-resource-access` is ACTIVE (JWT verification enabled, `verify_jwt = true`).
- [ ] **Edge Function Runtime Secrets**:
  - `SITE_URL` is set to `https://dr-afif.github.io/bls/` in Supabase Project Settings → Edge Functions → Secrets.
- [ ] **Auth URL Configuration**:
  - Site URL is set to `https://dr-afif.github.io/bls/`.
  - Redirect allowlist includes `https://dr-afif.github.io/bls/**` and local dev URLs.
- [ ] **Custom SMTP Configuration**:
  - Custom SMTP is enabled and connected to dedicated Gmail infrastructure on port 465 (SSL).
  - Sender name is `BLS Course Companion`.
- [ ] **Invite User Email Template Contract**:
  - Confirm hosted template uses `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`.
  - Confirm `{{ .ConfirmationURL }}` is NOT present in the template.
- [ ] **Password Security**:
  - "Check for leaked passwords" is enabled in Supabase Dashboard (Authentication → Password).
- [ ] **Storage Bucket Privacy**:
  - Bucket `course-resources` is private with 0 public access policies.
- [ ] **Live Browser Smoke Tests (Production GitHub Pages)**:
  - Sign in with existing credentials (`/auth/login`).
  - Verify session restoration upon page refresh.
  - Verify role-based navigation (learner sees learner shell; admin sees admin shell; instructor sees instructor shell).
  - Verify PWA install prompt / manifest registration and offline application-shell loading (`/bls/sw.js`).
  - Verify invitation flow with TokenHash callback (`#/auth/callback?token_hash=...&type=invite`) if an invite is issued.
  - Verify unauthorized access to `/app/admin/*` is blocked for non-admin accounts.
- [ ] **Security & Secret Audit**:
  - Confirm no service-role keys, database passwords, or SMTP secrets are present in frontend source, `.env`, or build output.
  - Confirm no access tokens appear in URL query strings or browser history.
  - Confirm all browser-accessible tables enforce Row Level Security.

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
