# Milestone 4 Phase 2 Plan — Private Storage and Authorized PDF Access

**Status:** complete in the hosted fictional development project on
2026-08-14. Production Guides, Teaching Kit, and viewer routes remain unchanged.

## Outcome

Add a private, auditable PDF-delivery boundary for the fictional hosted
development project. An authenticated learner, instructor, or administrator
may receive a 60-second signed PDF URL only when the database confirms access
to the current published resource version. Browser clients must not gain broad
Storage read, list, overwrite, move, or delete access.

This phase does not connect the production Guides, Teaching Kit, resource
viewer, or administrator resource editor. Those remain Phases 3 and 4.

## Starting checkpoint

- Milestone 4 Phase 1 migrations are applied to hosted project
  `zlaixhnyydxgbphgsetv`.
- All 69 hosted pgTAP assertions pass.
- The hosted fixture contains one course, two entitlements, eight resources,
  eight immutable versions, six topics, four teaching stages, and one relation.
- Two fictional PDF version records already use version-specific Storage paths.
- No service worker or runtime cache is implemented in the repository yet.
- Local Docker remains unavailable, so hosted integration verification is
  required in addition to dependency-injected function tests.

## Scope

### Included

- Private `course-resources` Supabase Storage bucket
- PDF-only, conservative per-file size restriction
- Version-specific object paths
- Administrator upload-insert policy for matching draft PDF versions
- No browser overwrite, move, delete, list, or direct download policy
- Authenticated `issue-resource-access` Edge Function
- Explicit database authorization for a verified user identifier
- Short-lived URL issuance, rate limiting, idempotency, and append-only events
- Two clearly fictional PDF fixtures
- Storage-policy, database-function, Edge Function, hosted integration, secret,
  and cache-boundary tests
- Generated database types and continuity documentation

### Excluded

- Production resource-list or viewer integration
- Administrator resource editor and upload UI
- Watermark rendering, print-control treatment, or viewer analytics
- Protected offline access or service-worker implementation
- Real clinical guidance, learner information, or production documents
- Public buckets, permanent URLs, object replacement, or destructive cleanup
- Video-hosting changes

## Final architecture decisions

### Bucket

- Name: `course-resources`
- Public: `false`
- Allowed MIME type: `application/pdf`
- Maximum object size: `20 MiB`, below the current 50 MiB project limit
- Object path:
  `<organization-id>/<resource-id>/<version-id>/<safe-random-name>.pdf`

The bucket configuration is represented in repository configuration and a
migration so a fresh environment and the hosted project converge on the same
private settings.

### Storage policies

Authenticated browser users receive no `SELECT` policy on
`storage.objects`. Consequently, they cannot list objects or download a private
object directly through the normal authenticated Storage endpoint.

Administrators receive only `INSERT`, with all of these checks:

- the bucket is `course-resources`;
- the first three path segments are valid UUIDs;
- the first segment matches the administrator's organization;
- the resource and version match those path segments;
- the record is a PDF version in the administrator's organization;
- the version is still draft and is not current or historically published;
- the complete object name exactly matches the version's recorded
  `storage_path`;
- the acting user is an active same-organization administrator.

No authenticated `UPDATE` or `DELETE` policy is created. Upload uses
`upsert: false`; an existing path therefore cannot be replaced. No browser
policy permits move or copy because those operations require source/destination
permissions that are intentionally absent.

### Function authentication

Create `issue-resource-access` using the current `@supabase/server` Edge
Function wrapper with `auth: "user"` and keep `verify_jwt = true`.

The browser's publishable key remains in the `apikey` header. The signed-in
user JWT is sent separately in `Authorization` by `supabase.functions.invoke`.
The platform verifies the JWT before the handler runs, and the wrapper provides
verified user claims plus user-scoped and privileged clients. A publishable or
secret key is never treated as a bearer JWT.

The secret client is used only after user authentication, and only to call the
service-only authorization function, create the signed URL, and append the
issuance event. No secret key is added to frontend code, repository files, or
GitHub Pages variables.

### Database authorization and rate limiting

Add a migration that:

1. Introduces an explicit-user private authorization helper and makes the
   existing `private.can_read_resource(resource_id)` wrapper delegate to it.
2. Adds service-only `public.authorize_resource_pdf_access(user_id,
   version_id, request_id)`, with execution revoked from `PUBLIC`, `anon`, and
   `authenticated` and granted only to `service_role`.
3. Validates active account, role, organization, entitlement window, optional
   cohort membership, instructor assignment, audience, resource publication
   and availability, current version, PDF type, and non-empty Storage path.
4. Uses a transaction-scoped advisory lock per user and enforces at most ten
   authorized URL requests in a rolling 60-second window.
5. Makes `request_id` idempotent for the same user, resource version, and event
   action.
6. Records `signed_url_authorized` without storing a URL, token, IP address, or
   unnecessary device data, then returns only the authorized object path and
   identifiers to the trusted function.

After Storage signs the object, the Edge Function inserts
`signed_url_issued`. If that append fails, the function does not return the URL.
Signing failures produce safe logs and no URL response; the prior authorization
event remains useful evidence that delivery was attempted.

### Function contract

- Method: `POST`
- Input: `{ "resourceVersionId": "uuid", "requestId": "uuid" }`
- Success: `{ "signedUrl": "...", "expiresIn": 60,
  "resourceVersionId": "uuid" }`
- Response headers: `Cache-Control: no-store, private`, `Pragma: no-cache`, and
  an expired `Expires` value
- Supported origins: deployed GitHub Pages origin and documented local Vite
  origins; reject unapproved browser origins
- Stable failures:
  - `INVALID_REQUEST` — 400
  - `AUTHENTICATION_REQUIRED` — 401
  - `RESOURCE_ACCESS_DENIED` — 403
  - `RESOURCE_NOT_FOUND` — 404 only where disclosure is safe; otherwise 403
  - `RATE_LIMITED` — 429 with a short `Retry-After`
  - `RESOURCE_ACCESS_UNAVAILABLE` — 503

Responses and logs never include raw database errors, secret values, user JWTs,
or full signed URLs.

## Implementation work packages

### 1. Migration and Storage configuration

- Generate a migration using the Supabase CLI.
- Upsert the private bucket configuration without changing it to public.
- Add the explicit-user authorization helper, service-only access function,
  idempotency index, event actions, and upload-path validation helper.
- Add the administrator-only `storage.objects` insert policy.
- Keep all ordinary authenticated Storage select/update/delete operations
  denied.
- Regenerate public database types after hosted application.

Expected files:

- `supabase/migrations/<timestamp>_milestone_4_private_resource_access.sql`
- `supabase/config.toml`
- `src/lib/supabase/database.types.ts`

### 2. Fictional PDF fixtures

- Create two minimal, visibly fictional PDFs corresponding to the existing PDF
  version records.
- Include a prominent statement that they are interface-test content, not
  clinical guidance.
- Store them under version-specific fixture paths and seed them with the bucket
  tooling or a documented hosted-development command.
- Verify MIME type, file size, object path, and private bucket state after
  upload.

Expected files:

- `supabase/fixtures/course-resources/.../*.pdf`
- optional fixture-generation or verification script if needed

### 3. Edge Function

- Scaffold `issue-resource-access` with the CLI's user-auth mode.
- Pin the `@supabase/server` import version.
- Separate request parsing, origin checking, authorization, signing, audit
  append, and safe error mapping into small testable functions.
- Sign only the exact path returned by the service-only database function.
- Use a 60-second expiry and no-store response headers.
- Deploy with JWT verification enabled.

Expected files:

- `supabase/functions/issue-resource-access/index.ts`
- `supabase/functions/issue-resource-access/index.test.ts`
- small shared response/error helpers only if reuse is immediate
- `supabase/config.toml` function configuration

### 4. Database and Storage tests

Extend pgTAP coverage for:

- bucket exists and is private;
- MIME and size restrictions are correct;
- anonymous and authenticated users cannot list or directly select objects;
- learner and instructor cannot upload;
- same-organization administrator can insert only the exact draft PDF path;
- cross-organization, malformed, non-PDF, wrong-version, current-version, and
  overwrite attempts fail;
- no authenticated update or delete path exists;
- service-only authorization function cannot be called by browser roles;
- active entitled learner, assigned instructor, and same-organization admin are
  authorized;
- suspended, expired, revoked, wrong-audience, wrong-organization, unpublished,
  non-current, and non-PDF cases fail;
- duplicate `request_id` is idempotent;
- the eleventh request within 60 seconds is rate-limited;
- authorization and issuance events contain no URL or token.

### 5. Function and hosted integration tests

Dependency-injected function tests cover input validation, method handling,
origin handling, auth failure, safe errors, signing failure, audit failure,
rate-limit mapping, expiry, and response cache headers.

Hosted smoke tests cover:

- no JWT;
- malformed/expired JWT;
- suspended and expired learner;
- wrong organization and wrong audience;
- entitled learner;
- assigned instructor;
- same-organization administrator;
- direct unsigned object URL denial;
- successful signed retrieval before expiry;
- denial after expiry;
- no raw signed URL in database events or function logs.

Use fictional accounts and documents only. Do not print credentials or signed
URLs into command output retained in logs.

### 6. Advisors and repository verification

Run:

- migration dry run and hosted apply;
- hosted pgTAP suites;
- Edge Function unit tests and hosted smoke tests;
- Storage/security inspection;
- Supabase security and performance advisors;
- generated-type refresh;
- typecheck, lint, frontend tests, and production build;
- secret scan and repository search for protected-cache patterns;
- Markdown-link and diff checks.

Because no service worker exists yet, Phase 2 can prove only that the function
response is `no-store`, signed URLs are not persisted by application code, and
no broad cache rule exists. Full browser service-worker cache inspection remains
a Phase 3/5 gate when the PWA worker is implemented.

## Sequencing

1. Confirm current hosted migration and bucket state.
2. Write the migration and pgTAP tests before granting Storage insert access.
3. Apply the migration to the fictional hosted project and rerun all SQL tests.
4. Create and upload the fictional PDF fixtures.
5. Implement and unit-test the Edge Function.
6. Deploy the function with JWT verification enabled.
7. Run the hosted authorization, expiry, direct-access, audit, and rate-limit
   matrix.
8. Run advisors and full repository checks.
9. Update changelog, data model, security/deployment notes, and handoff.
10. Stop before production UI wiring and request review for Phase 3.

## Rollback and recovery

- Disable or undeploy the Edge Function first if an authorization defect is
  discovered.
- Revoke the Storage insert policy with a forward-fix migration.
- Keep the bucket private and retain uploaded fictional objects while fixing
  access logic; do not make the bucket public as a workaround.
- Rotate the function's named secret key if exposure is suspected.
- Preserve append-only access events and version records.
- Prefer forward-fix migrations; do not delete Phase 1 history.

## Exit criteria

- The bucket is private and restricted to PDF files no larger than 20 MiB.
- Direct anonymous and ordinary authenticated object access fails.
- Normal browser roles cannot list, overwrite, move, or delete objects.
- Only an active same-organization administrator can insert the exact draft PDF
  version path.
- The function accepts only a verified signed-in user and returns a 60-second
  URL only after complete database authorization.
- Expired, suspended, revoked, wrong-organization, wrong-audience,
  unpublished, non-current, and non-PDF requests fail safely.
- Rate limiting and request idempotency are proven.
- URL authorization and issuance are auditable without storing signed URLs.
- Signed URLs stop working after expiry.
- Responses are explicitly non-cacheable, and no protected path is present in
  application/runtime cache configuration.
- All SQL, function, static, frontend, build, advisor, and secret checks pass.
- Production Guides, Teaching Kit, and administrator UI remain unchanged.

## Exact next action

Plan Milestone 4 Phase 3: replace production learner Guides and instructor
Teaching Kit mock reads with typed Supabase repositories, add resource filters
and accessible viewer integration, and invoke `issue-resource-access` only when
an authorized user opens a PDF. Keep signed URLs in memory only and exclude
protected responses from every application or service-worker cache.

## Implementation result

- Applied migration
  `20260814011444_milestone_4_private_resource_access.sql` to hosted project
  `zlaixhnyydxgbphgsetv`.
- Created the private PDF-only `course-resources` bucket with a 20 MiB limit and
  uploaded two visibly fictional, non-clinical one-page PDF fixtures.
- Deployed active Edge Function version 2 with `verify_jwt = true` after fixing
  the wrapper integration to use the documented `userClaims.id` property.
- Hosted pgTAP verification passes 109 assertions across four files; the new
  Storage/access suite contributes 40 assertions.
- Vitest passes 31 tests across 12 files; 12 tests cover the function handler.
- Hosted smoke checks passed for learner, instructor, and administrator signed
  retrieval; missing JWT, unsigned object, unapproved origin, non-PDF version,
  and unknown version were denied as intended.
- The hosted rolling-window check allowed ten rapid requests for one fictional
  learner and returned HTTP 429 for the eleventh request.
- Successful URLs report a 60-second expiry and retrieved the expected PDF
  before expiry. Database authorization/issuance events contain no signed URL
  or token metadata.
- Typecheck, lint, production build, generated types, migration-list check, and
  advisor review passed. The security advisor retains the pre-existing
  project-level leaked-password-protection warning; performance notices are
  unused-index informational findings in the low-traffic fictional project.
- A timed post-expiry network fetch was not retained as a separate automated
  test; the exact 60-second signing argument and response contract are covered
  by unit tests and hosted pre-expiry retrieval. Add browser-level expiry and
  cache checks when Phase 3 introduces the production viewer.

## Current Supabase references

- [Storage bucket fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage file limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Edge Function authorization headers](https://supabase.com/docs/guides/functions/auth-headers)
- [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets)
