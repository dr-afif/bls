# Development Handoff

## Last updated

2026-08-14

## Current milestone

Milestones 1 through 3 are complete. Milestone 4, Resources and Teaching
Materials, is active. Phase 1 schema, RLS, auditing, fictional fixtures, hosted
tests, and generated types are complete. Phase 2 private Storage and signed
access is deployed and verified. Phase 3 production resource catalog and
protected-viewer integration is next.

## Current repository state

- React, TypeScript, Vite, Tailwind, React Router, and Vitest frontend.
- Distinct learner, instructor, and administrator route trees and shells.
- Fictional local data remains visible for resources, quizzes, results, and
  analytics. Authenticated People/Cohorts uses Supabase, and the hosted resource
  foundation is ready but is not connected to production Guides/Teaching Kit
  routes until Phase 3.
- Clinical Field Guide styling for learner and instructor screens.
- Compact Operational Course Companion density for administrator screens.
- Hosted Supabase development database with the initial identity/access schema,
  explicit grants, RLS policies, fictional organization seed, and generated
  TypeScript types. The frontend now connects through validated public
  configuration for invite-only sign-in, recovery, session restoration, and
  RLS-backed profile/role checks. The hosted project now also contains a
  private fictional PDF bucket and JWT-protected signed-access function. There
  are no real users, clinical documents, secure scoring, or real exports.

## Work completed

- Removed the former dashboard, sequential course, lesson, progress, completion
  gate, and continue-learning patterns.
- Added learner Home, Guides, resource viewer, Quiz, result summary, and Profile.
- Added instructor Home, Teaching Kit, resource presentation view, Cohorts, and
  Profile.
- Added administrator Overview, People, Cohorts, Resources, Quizzes, Results,
  and Settings.
- Added search and filters, current and historical cohort context, fictional
  readiness states, and responsive tables/cards.
- Added local released/unreleased post-test visual states and explicitly
  non-functional export controls.
- Added focused tests for guide filtering, release-state preview, and export
  boundary messaging.
- Corrected the `USER_VALIDATION_PLAN.md`, `USER_VALIDATION_SCRIPT.md`, `USER_VALIDATION_FINDINGS.md`, and `VALIDATION_TASK_MATRIX.md` to precisely match existing application routes and workflows.
- Completed an evidence-based `HEURISTIC_REVIEW.md` of the rendered application components, confirming the presence of skip navigation, logical tab order, responsive bounds across tested viewports, and non-color-only statuses. Identified and corrected 2 objective defects (semantic heading and mobile header density).
- Recorded six simulated role-persona sessions as owner-accepted proxy
  validation. This permits production planning but is not represented as
  independent human-subject validation.
- Evaluated HeroUI React v3 with Tailwind CSS v4 and decided to retain the
  current source-owned Radix/shadcn-style component layer and Tailwind CSS v3.
- Approved conservative MVP authorization policies and added the initial local
  Supabase configuration, identity/access migration, fictional organization
  seed, explicit grants, deny-by-default RLS policies, and pgTAP tests.
- Linked the repository to hosted development project
  `zlaixhnyydxgbphgsetv`, confirmed it was empty, and applied the identity/access
  migration and fictional seed.
- Added a follow-up migration covering the four foreign keys identified by the
  performance advisor and generated `src/lib/supabase/database.types.ts` from
  the verified hosted schema.
- Added pinned Supabase, TanStack Query, React Hook Form, Zod, and resolver
  dependencies; a typed browser client and query provider; authentication
  forms; account/role bootstrap; access-state handling; and guarded production
  role landing routes.
- Preserved all `/demo` routes and kept their fictional repositories separate
  from authenticated production state.
- Provisioned three email-confirmed fictional test accounts as active learner,
  instructor, and administrator users in the demonstration organization. Each
  provisioning action has a corresponding audit event.
- Added a GitHub Pages workflow that runs typecheck, lint, tests, and the
  production build before deploying `dist`, using repository variables for the
  two public Supabase values.
- Merged PR #1, deployed the authentication foundation through GitHub Actions,
  configured the hosted Supabase Site URL and redirect allow-list, and
  successfully smoke-tested sign-in, sign-out, and password recovery on the
  deployed application.
- Added cohort operational fields, same-organization and role-matching
  membership invariants, administrator-only lifecycle writes, consolidated
  profile-update RLS, and automatic audit triggers.
- Added a fictional hosted cohort with learner and instructor assignments,
  regenerated database types, and connected authenticated People/Cohorts
  repositories through TanStack Query.
- Replaced the production placeholder with accessible role-specific workspaces:
  administrator People/Cohorts management, instructor assigned-cohort roster,
  and learner physical-course details. The separate `/demo` experience remains
  unchanged.
- Added organization-scoped courses and required cohort-to-course association,
  effective fixed-window/permanent entitlements, BLS topics, teaching stages,
  resource metadata, immutable versions, audiences, taxonomy assignments,
  related resources, and append-only access-event records.
- Added explicit browser grants, deny-by-default RLS, administrator-only
  lifecycle writes, an audited publication RPC, version and organization
  invariants, and resource/classification/entitlement audit triggers.
- Loaded fictional hosted fixtures: one Adult BLS course, two active test-user
  entitlements, six topics, four teaching stages, eight published immutable
  resource versions, and one related-resource link.
- Updated cohort creation to resolve the organization’s published course and
  regenerated public-schema TypeScript types.
- Added the private PDF-only `course-resources` bucket, exact-path
  administrator draft insert policy, service-only authorization/issuance RPCs,
  per-user rate limiting, idempotent audit events, and 40 hosted pgTAP
  assertions for Storage and access boundaries.
- Generated and visually verified two one-page fictional PDF fixtures that are
  explicitly labelled as non-clinical development data, then uploaded them to
  version-specific private object paths.
- Implemented, unit-tested, and deployed JWT-protected Edge Function
  `issue-resource-access`; it authorizes the verified user, returns a 60-second
  signed URL with no-store headers, and fails closed if signing or audit append
  fails.
- Regenerated hosted database types and smoke-tested signed retrieval for all
  three fictional roles plus unsigned, unauthenticated, non-PDF, unknown
  version, and unapproved-origin denial cases.

## Decisions implemented

- Learners see date, time, venue, instructor, contact, and preparation notes.
- Guides use BLS topic as the primary organization, with resource-type filters.
- Learners see score and topic summary; question review is deferred.
- The prototype includes one current cohort and historical-cohort context.
- Instructors see learner names and pre-test completion status, never answers.
- Teaching Kit uses teaching stage plus topic and type filters.
- An authorized instructor or administrator will manually release the post-test
  after the physical course; only local visual states exist here.
- Planned production exports are roster CSV, quiz results CSV, and combined
  pre-/post-test CSV.

## Latest verification status

- Phase 2 migration
  `20260814011444_milestone_4_private_resource_access.sql` is applied; hosted
  migration history now contains all Milestone 4 migrations through Phase 2.
- Hosted `supabase test db --linked`: passed 109 assertions across four files
  (15 identity/access, 23 People/Cohorts, 31 resource catalog, and 40 private
  Storage/access assertions).
- Private bucket inspection: `course-resources` is non-public, PDF-only, limited
  to 20 MiB, and contains exactly the two expected fictional fixture objects.
- Edge Function `issue-resource-access` version 2 is active with platform JWT
  verification enabled. CORS preflight returned 204.
- Hosted smoke checks: learner, instructor, and administrator each received a
  60-second signed URL and retrieved the expected PDF; missing JWT, unsigned
  public object path, non-PDF version, unknown version, and unapproved origin
  were denied.
- Hosted rate-limit smoke check returned ten successes followed by HTTP 429 on
  the eleventh rapid request for the same fictional learner.
- Audit verification found matching `signed_url_authorized` and
  `signed_url_issued` events, with no URL/token material in metadata.
- Final repository verification: typecheck passed; lint passed; 31 Vitest tests
  across 12 files passed; production build passed with 1,815 transformed
  modules and the existing non-blocking main-chunk warning.
- Supabase security advisor has no schema/RLS errors. Its one warning is the
  pre-existing disabled leaked-password protection setting. Performance
  findings are unused-index informational notices expected before meaningful
  application traffic.
- Both fixture PDFs are one page, have extractable text, render without layout
  defects, and visibly state that they are fictional and not clinical guidance.

- Milestone 4 Phase 1 migrations through
  `20260813083756_milestone_4_resource_authorization_audit.sql` are applied to
  hosted project `zlaixhnyydxgbphgsetv`.
- Hosted `supabase test db --linked`: passed 69 assertions across three files
  (15 identity/access, 23 People/Cohorts, and 31 resource/access assertions).
- Hosted fixture verification: one course, two entitlements, eight resources,
  eight immutable versions, six topics, four teaching stages, and one relation.
- Security advisor reports no schema/RLS errors. Its single warning is the
  already documented project-level leaked-password protection setting.
- Performance advisor reports only unused-index informational notices, expected
  before the new resource queries receive application traffic.
- Final Phase 1 frontend verification: typecheck passed, lint passed, all 19
  tests across 11 files passed, and the production build passed with 1,815
  modules transformed and the existing non-blocking main-chunk warning.
- Deployed Milestone 3 smoke testing on 2026-08-13 passed for all three
  fictional roles: administrator People and Cohorts loaded live data; the
  learner saw only permitted physical-course details; the instructor saw the
  assigned cohort and permitted roster; learner and instructor access to
  administrator routes was denied; sign-out returned to login; and the browser
  reported no warnings or errors.
- The deployed smoke test intentionally performed no administrative mutation.
  The hosted audit table contains the three fictional account-provisioning
  events; cohort, membership, and account-status audit triggers remain covered
  by the passing 38-assertion pgTAP suite.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed (19 tests across 11 files).
- `npm run build`: passed (1,809 modules transformed; one non-blocking main
  chunk size warning).
- Local `.env.local` now contains the hosted development project's URL and
  publishable browser key and remains excluded by `*.local` in `.gitignore`.
- Hosted Auth settings responded with HTTP 200 using the publishable key; an
  anonymous `profiles` request was rejected with HTTP 401 as intended.
- The hosted migration, RLS-test portability correction, generated database
  types, and documentation updates were followed by successful typecheck,
  lint, 10 frontend tests, and production build (1,620 modules) on 2026-08-11.
- Hosted Supabase project `zlaixhnyydxgbphgsetv`: active and healthy. Both
  repository migrations are recorded remotely.
- Hosted `supabase test db --linked`: passed all 15 pgTAP assertions.
- Hosted `supabase test db --linked` was rerun after frontend configuration on
  2026-08-11 and again passed all 15 pgTAP assertions.
- Direct hosted Auth checks passed for the learner, instructor, and
  administrator test accounts. Each could load its active profile and expected
  role through RLS and sign out successfully.
- Rendered local UI checks passed for all three role redirects and sign-out,
  learner session restoration after reload, learner denial from the admin
  route, and browser console output.
- At the identity-foundation checkpoint, the hosted security advisor reported
  zero findings; the current advisor result is recorded above.
- Hosted performance advisor: no missing-index findings. Remaining informational
  notices identify unused indexes, which is expected before application traffic.
- Post-test database check: zero Auth users, one fictional organization, zero
  profiles, zero public tables without RLS, and no temporary CLI test permission.
- TypeScript database types generated successfully from the hosted `public`
  schema.
- Local Markdown-link validation: passed.
- Rendered browser and source inspections completed at 320×800, 375×812, 1024×768, and 1440×900 viewports.
- Checks covered learner, instructor, and administrator headers; route focus to main content; skip navigation accessibility; presentation-view activation and Escape exit; invalid route heading hierarchy; horizontal reflow at 320px; and console warnings/errors.
- Identified and corrected two objective UI defects: proper semantic `h1` usage for the standalone not-found route, and compacting the prototype/demo data tags into a space-efficient mobile header row without page-level horizontal overflow.
- PR #1 merged into `main` at commit
  `30574a98b18a57b587472a98c9a4ffad1b19163e`; the GitHub Pages deployment
  completed successfully.
- Product-owner smoke testing confirmed deployed sign-in, sign-out, and
  password-recovery behaviour after the production and local redirect URLs
  were configured in Supabase Auth.
- Hosted Milestone 3 migrations through
  `20260813035236_consolidate_profile_update_policy.sql` are applied.
- Hosted pgTAP suites pass all 38 assertions across identity/access and
  People/Cohorts authorization, invariants, lifecycle writes, and auditing.
- Rendered local browser verification passed for administrator People/Cohorts,
  learner course detail, instructor permitted roster, role routing, sign-out,
  and learner denial from the administrator route.
- Final typecheck, lint, 19 frontend tests, and GitHub Pages production build
  pass (1,815 modules transformed; existing non-blocking chunk warning).
- Supabase security advisor reports no schema/RLS findings. The remaining Auth
  warning is project-level leaked-password protection being disabled.
- Performance advisor reports only expected unused-index informational notices
  before production traffic.

## Exact recommended next action

Plan and implement Milestone 4 Phase 3: connect production learner Guides and
instructor Teaching Kit routes to typed resource repositories, add accessible
resource viewing, and invoke the deployed PDF-access function at open time.
Keep signed URLs in memory only, preserve the current mock `/demo` route tree,
and add browser tests proving logout/expiry/error states and protected-content
cache exclusion. Do not add administrator upload/editing UI until Phase 4.

## Proxy-validation follow-up questions

- Do instructors find "Teaching Kit" more intuitive than "Resources"?
- Is the administrative "Overview" screen too dense when multiple actionable exceptions exist simultaneously?
- Does the Learner "Home" screen prioritize the physical course location sufficiently above the Quick Guides?

These questions are non-blocking and should be revisited if access to
representative users becomes practical.

## Remaining production decisions

- No production-policy decision currently blocks the identity and access
  foundation. The approved defaults are recorded in
  `PRODUCTION_POLICY_DECISIONS.md`.

## Component-system decision

The deferred evaluation is complete. Do not adopt HeroUI React v3 or migrate
from Tailwind CSS v3 to Tailwind CSS v4 for the current production milestone.

- Do not use HeroUI Native.
- Continue using the current source-owned Radix/shadcn-style components,
  Lucide icons, semantic design tokens, and Tailwind CSS v3.
- Reconsider only for a demonstrated production component gap or a separately
  approved dependency-review milestone.
- If reconsidered, confirm the supported-browser baseline and use the HeroUI
  React MCP server before a migration spike.
- The HeroUI React MCP server was not installed in the current environment, so
  this evaluation used current official HeroUI and Tailwind documentation.

## Known limitations

- Resource schema and fictional fixtures now exist in hosted development, but
  production resource routes still use local prototype data. Quiz, result,
  analytics, and export data also remains local and fictional; no real learner
  information is present.
- The demo role selector is intentionally separate from authentication and
  authorization.
- Post-test release, quiz security, scoring, access expiry, and route visibility
  are not server-enforced.
- Private resource Storage and signed access are implemented for fictional PDF
  fixtures, but production resource repositories, watermark identity, viewer
  wiring, post-expiry browser verification, and protected-cache inspection
  remain Phase 3 work.
- Export buttons never generate files.
- Analytics are illustrative and are not calculated from persisted attempts.
- PWA offline caching and install behavior are not part of this milestone.
- The local Docker-based Supabase stack remains unavailable, so database
  verification currently uses the hosted fictional development project.
- The installed UI/UX skill package references a missing design-system
  generator, so its documented design and accessibility rules were applied
  directly.
- `npm audit` reports two moderate React Router 6 advisories. The remaining
  supported fix is a breaking React Router 7 migration; the current app is
  client-side only and constrains post-login redirects to internal paths.
- The shared test password is intentionally temporary and weak. Replace it with
  unique generated passwords before any broader testing and never reuse these
  accounts for real learner information.
- Supabase Auth leaked-password protection is disabled. Enable it and replace
  the shared fictional test password before broader or real-user testing.
- The OneDrive workspace's `.git` directory remains an inaccessible cloud
  reparse point to command-line Git even though the visible project files are
  hydrated. A healthy replacement clone now exists at
  `C:\Users\DR-AFIF\Documents\GitHub\bls`; use that non-OneDrive checkout for
  Git-based development and publication. Keep the OneDrive copy only until all
  unpublished work has been confirmed in GitHub.
