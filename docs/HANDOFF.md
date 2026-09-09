# Development Handoff

## Last updated

2026-09-09

## Current milestone

- Milestone 5 (Phases 5.1, 5.2, 5.3, and 5.4) — COMPLETE.
  - Phase 5.1: Secure quiz engine foundation, attempts, autosave, server timing, scoring, audit logging.
  - Phase 5.2: Administrator quiz authoring, question bank, and immutable publication.
  - Phase 5.3: Learner quiz journey, timer, autosave, submission, and learner-safe results.
  - Phase 5.4: Instructor assessment readiness, post-test release, and administrator results/details.
- Milestone 6 (Phases 6.1, 6.2, 6.3, 6.4, 6.5) — ACTIVE.
  - Phase 6.1: Secure Reporting Foundation — COMPLETE.
  - Phase 6.2: Administrator Cohort Analytics UI — COMPLETE.
  - Phase 6.3: Secure Question & Item Analysis — COMPLETE.
  - Phase 6.4: Audited CSV Exports — COMPLETE.
  - Phase 6.5.1: Production Readiness Audit & Hardening Plan — COMPLETE.
  - Phase 6.5.2A: Production Identity & Safe PWA Shell — COMPLETE.
    - Phase 6.5.2B1: Secure User Provisioning & Access-State Hardening (Local Implementation) — COMPLETE.
    - Phase 6.5.2B1.5: Provisioning Transaction & Identity-Lifecycle Hardening — COMPLETE (local-only; linked verification pending).
    - Phase 6.5.2B1.6: Pre-Deployment Provisioning Safety Corrections — COMPLETE (local-only; linked verification pending).
    - Phase 6.5.2B1.7: PKCE-Compatible Invitation Acceptance — COMPLETE (local-only; linked verification pending).
    - Phase 6.5.2B1.8: Invitation Template Redirect Contract Correction — COMPLETE (local-only; linked verification pending).
    - Phase 6.5.2B2A: Hosted Provisioning Infrastructure Deployment & Verification — NEXT.
  - Phase 6.5.2C: Clinical Data Protection & Security Controls — PENDING.
  - Phase 6.5.2D: Backup, Telemetry, CI/CD & Operations — PENDING.


## Current repository state

- React, TypeScript, Vite, Tailwind, React Router, and Vitest frontend.
- Distinct learner, instructor, and administrator route trees and shells.
- Fictional local data remains visible for quizzes, results, analytics, and all
  `/demo` routes. Authenticated People/Cohorts, learner Guides, instructor
  Teaching Kit, administrator Resources, structured resource viewing, and
  protected fictional PDFs now use Supabase through typed repositories and
  server-enforced access.
- Clinical Field Guide styling for learner and instructor screens.
- Compact Operational Course Companion density for administrator screens.
- Hosted Supabase development database with the initial identity/access schema,
  explicit grants, RLS policies, fictional organization seed, and generated
  TypeScript types. The frontend now connects through validated public
  configuration for invite-only sign-in, recovery, session restoration, and
  RLS-backed profile/role checks. The hosted project now also contains a
  private fictional PDF bucket and JWT-protected signed-access function. There
  are no real users, clinical documents, approved clinical quiz questions, or
  real exports. Secure quiz attempts and scoring now exist only for fictional,
  non-clinical fixtures and are not yet wired to the production route UI.

## Work completed

- Implemented Milestone 6 Phase 6.5.2B1.8: Invitation Template Redirect Contract Correction (Local Implementation):
  - Corrected email template application base variable:
    * In `supabase/templates/invite.html`, updated the Accept Invitation link from `{{ .SiteURL }}` to `{{ .RedirectTo }}`:
      `<a class="button" href="{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>`.
    * Solved variable separation: Supabase GoTrue sets `{{ .SiteURL }}` to the project's configured default site URL, while `{{ .RedirectTo }}` reflects the exact `redirectTo` parameter passed to `inviteUserByEmail`.
    * Linked Edge Function contract: `admin-invite-user` passes `redirectTo = "${normalizedBase}/"` (derived from mandatory `SITE_URL`); using `{{ .RedirectTo }}` ensures that the explicit `SITE_URL` runtime environment variable strictly governs the invitation destination URL.
  - Recorded hosted B2A prerequisite:
    * Before sending remote invitations, the hosted Supabase Auth Redirect URL allowlist must explicitly permit the exact production base URL passed as `redirectTo` (`https://dr-afif.github.io/bls/`).
  - Updated template tests in `src/features/auth/templates/invite-template.test.ts`:
    * Added assertions proving the template uses `{{ .RedirectTo }}`, does not use `{{ .SiteURL }}` for the destination, preserves `{{ .TokenHash }}`, `type=invite`, and fragment-based `/auth/callback`.
    * Suite expanded to 8 tests passing.

- Implemented Milestone 6 Phase 6.5.2B1.7: PKCE-Compatible Invitation Acceptance (Local Implementation):
  - Solved GoTrue invitation redirect limitation: Supabase `auth.admin.inviteUserByEmail()` is not
    PKCE-capable and by default redirects with an implicit fragment (`#access_token=...`), which conflicts
    with React Router HashRouter (`/#/auth/callback#access_token=...`) and is rejected by PKCE-configured clients.
  - Implemented TokenHash + `verifyOtp({ token_hash, type: "invite" })` client-side acceptance flow:
    * Created repository-owned email template `supabase/templates/invite.html` using `{{ .TokenHash }}`,
      `type=invite`, and canonical SPA fragment destination `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`.
    * Configured local `supabase/config.toml` under `[auth.email.template.invite]`.
    * Documented that the hosted Supabase Auth "Invite User" template must match this template before Phase 6.5.2B2B invitations.
  - Updated Edge Function `admin-invite-user`:
    * Replaced redirect path with trusted application base URL `${normalizedBase}/` (`SITE_URL`).
    * Preserved Option A fail-closed behavior when `SITE_URL` is absent.
  - Updated `AuthCallbackPage`:
    * Added dedicated TokenHash invitation branch executing `supabase.auth.verifyOtp({ token_hash, type: "invite" })`.
    * Enforced strict type checking (`type === "invite"`); arbitrary/unexpected types fail closed without calling `verifyOtp`.
    * Sanitized URL and history via `window.history.replaceState` immediately upon verification or terminal failure.
    * Preserved existing PKCE password-recovery flow (`?code=...#/auth/callback`) untouched.
    * Confirmed session establishment and routed successfully verified invites to `/auth/reset-password` (`replace: true`).
    * Reconfirmed defense-in-depth: `/auth/reset-password` is protected by `RequireAuthentication` route guard and `ResetPasswordPage` component state checks.
  - Added deterministic test coverage:
    * Created `src/features/auth/templates/invite-template.test.ts` (7 static validation tests).
    * Created `src/features/auth/pages/auth-callback-page.test.tsx` (11 comprehensive callback tests).
    * Updated `supabase/functions/admin-invite-user/handler.test.ts` (29 handler tests passing).

- Implemented Milestone 6 Phase 6.5.2B1.6: Pre-Deployment Provisioning Safety Corrections (Local Implementation):
  - Corrected target-user takeover vulnerability in `public.provision_invited_user`:
    * Added exclusive row locking with `SELECT ... FOR UPDATE` on `public.profiles`.
    * Enforced strictly unprovisioned target invariants: requires `organization_id IS NULL`,
      `account_status = 'pending_verification'`, and 0 existing assigned roles in `public.user_roles`.
    * Rejected established users, existing organization members, and non-pending accounts with error `42501`.
    * Removed destructive role replacement: eliminated `DELETE FROM public.user_roles`. Provisioning
      proves zero roles exist and inserts exactly one allowed initial role (`learner` | `instructor`).
    * Preserved concurrency safety: competing concurrent calls on the same target are serialized by
      the profile row lock, and the second invocation fails invariant checks without mutating.
  - Corrected invitation redirect route:
    * Removed direct non-hash route `/auth/reset-password` from `admin-invite-user` Edge Function.
    * Replaced with canonical SPA hash callback contract: `${siteUrl.replace(/\/+$/, "")}/#/auth/callback`.
    * Adopted Option A for `SITE_URL` configuration: explicit environment variable required; missing
      or empty `SITE_URL` fails closed with 500 `CONFIGURATION_ERROR`.
  - Expanded pgTAP test suite in `supabase/tests/user_provisioning_transaction_test.sql`:
    * Added 16 new assertions covering established user rejection, existing role rejection (learner,
      instructor, admin, super_admin), active/suspended/expired status rejection, state preservation
      under failed takeover, and concurrency serialization (expanded to 30/30 assertions passing locally).
  - Added Edge Function tests covering redirect construction, Option A `SITE_URL` enforcement,
    and takeover compensation isolation, expanding frontend/Edge suite to 31 files and 170/170 tests passing.

- Implemented Milestone 6 Phase 6.5.2B1.5: Provisioning Transaction & Identity-Lifecycle Hardening (Local Implementation):
  - Resolved course entitlement ambiguity: confirmed `public.course_entitlements.course_id`
    is mandatory (`NOT NULL`) and course-specific. Decided generic user invitation provisions
    identity, tenancy, and role, while course/cohort entitlements remain a separate administrative workflow.
  - Established and closed the account status lifecycle: created `on_auth_user_confirmed` trigger
    on `auth.users` to automatically transition provisioned profiles from `pending_verification`
    to `active` upon email verification.
  - Created forward-only local migration `20260820090000_milestone_6_user_provisioning_transaction.sql`
    introducing transactional RPC `public.provision_invited_user`, executing profile, role, and audit
    updates in a single transaction callable exclusively by `service_role` with fixed `search_path = ''`.
  - Refactored `admin-invite-user` Edge Function to execute exactly one transactional RPC call,
    with compensating `auth.admin.deleteUser` on newly created Auth users if provisioning fails,
    and distinct `PROVISIONING_ROLLBACK_FAILED` handling if compensation deletion itself fails.
  - Verified `verify_jwt = true` in `supabase/config.toml` alongside function-level claims validation.
  - Added 14 isolated pgTAP assertions in `supabase/tests/user_provisioning_transaction_test.sql`
    (permissions, provisioning, role validation, rollback, and lifecycle transitions), all passing locally.
  - Added Vitest tests for transactional provisioning, compensation rollback failure, and post-invite
    lifecycle access gates, bringing frontend/Edge test total to 31 files and 163 tests passing.
- Implemented Milestone 6 Phase 6.5.2B1: Secure User Provisioning & Access-State Hardening.
  - Designed and built trusted Supabase Edge Function `admin-invite-user` with
    platform JWT authentication, independent caller claim extraction, active-status
    verification, and organization boundary validation.
  - Enforced strict role-escalation boundary: only `learner` and `instructor` roles
    can be invited; `admin` and `super_admin` invitations are rejected server-side.
  - Implemented access mode handling (`unlimited` vs `limited` window) with future
    expiry validation and optional start date.
  - Added partial-failure compensation: newly invited Auth users are deleted if
    subsequent database profile/role provisioning fails, while pre-existing accounts
    are preserved.
  - Recorded append-only `user.invited` audit events in `public.audit_events` without
    exposing secrets, tokens, or credentials.
  - Hardened security-sensitive access query in `useAccountAccess` with targeted
    `refetchOnWindowFocus: "always"` to immediately detect suspensions and revocations
    on tab focus, preserving global `refetchOnWindowFocus: false` for all other queries.
  - Integrated accessible `InviteUserDialog` into `/app/admin/people` with role-scoped
    visibility, duplicate submission prevention, disabled pending states, and mapped errors.
  - Added comprehensive unit and component tests (21 Edge Function handler tests,
    8 dialog tests, 4 page tests, 2 access-refetch tests), expanding the suite to
    31 test files and 161 tests passing.
- Implemented Milestone 6 Phase 6.5.2A: Production Identity & Safe PWA Shell,
  including canonical "BLS Course Companion" branding, standards-compliant Web
  App Manifest, branded SVG/PNG icons (192, 512, maskable), mobile
  `viewport-fit=cover`, and conservative `bls-shell-v1` service worker strictly
  excluding authenticated Supabase/API data from Cache Storage.

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
  per-user rate limiting, idempotent audit events, and 40

## Current state

Milestone 6 Phase 6.3 (Secure Question & Item Analysis) has been successfully implemented and verified. All automated and manual testing confirm that the server-owned item analytics RPC correctly aggregates historical submitted attempts. The UI uses these safe aggregates without client-side recalculation.
We are now ready for Milestone 6 Phase 6.4 (if any) or other directives as defined by the overall product direction.

## Last implemented
- Fixed a flaky UUID sort-ordering assumption in `item_analysis.test.sql` to make it order-independent.
- Implemented `get_admin_cohort_item_analysis` RPC for secure question-level assessment analysis.
- Created `ItemAnalysisTable` and related hooks to display item-level and distractor-level stats for cohorts.
- Expanded pgTAP coverage to 292 assertions across 11 files, ensuring question-version separation and accurate aggregates.
- Added comprehensive Vitest behavioural test coverage for the Analytics space.
- Persisted cohort selection across tab navigation using searchParams.

deployed JWT-protected Edge Function
  `issue-resource-access`; it authorizes the verified user, returns a 60-second
  signed URL with no-store headers, and fails closed if signing or audit append
  fails.
- Regenerated hosted database types and smoke-tested signed retrieval for all
  three fictional roles plus unsigned, unauthenticated, non-PDF, unknown
  version, and unapproved-origin denial cases.
- Added a typed production resource catalog repository and TanStack Query hooks
  that assemble the current immutable version, topics, teaching stages, and
  related resources while failing closed on malformed structured snapshots.
- Connected authenticated learner Guides and instructor Teaching Kit routes to
  live RLS-scoped data with URL-preserved search and filters, accessible state
  handling, and adaptive mobile bottom navigation.
- Added live guide/checklist/video presentation patterns and a lazy-loaded
  PDF.js viewer that consumes signed PDF bytes with `cache: no-store`, keeps
  signed URLs out of the DOM and Query cache, exposes page text to assistive
  technology, and applies a visible account/timestamp watermark.
- Added Phase 3 catalog, protected-access, and component tests. The current
  frontend suite contains 39 passing tests across 15 files.
- Realigned the fictional learner entitlement with the learner's current active
  fictional cohort after a previous smoke-test mutation had removed membership
  from the original demonstration cohort. The targeted hosted correction was
  recorded as `course.entitlement_updated` in the audit log.
- Merged PR #4 into `main` at commit
  `bb817de`, and the product owner confirmed that the GitHub Pages deployment
  completed successfully.
- Added the detailed Milestone 4 Phase 4 plan for authenticated administrator
  resource listing, metadata/classification editing, immutable version
  creation, exact-path private PDF upload and rollback, clinical review,
  approval, publication, retirement, preview, audit feedback, and verification.
- Added server-owned resource draft allocation and lifecycle transitions,
  atomic classification replacement, exact-path draft cleanup, immutable
  submitted/approved history, resource-scoped audit events, and stored PDF
  MIME/size readiness checks.
- Applied hosted migrations
  `20260814074046_milestone_4_admin_resource_workflow.sql` and
  `20260814081642_milestone_4_resource_pdf_metadata_validation.sql`, regenerated
  database types, and expanded hosted pgTAP coverage to 143 assertions across
  five files.
- Replaced the authenticated administrator Resources placeholder with live,
  responsive list/create/detail/version routes, URL-preserved filters, stable
  metadata and taxonomy forms, guide/checklist/video/PDF draft forms, exact-path
  private PDF upload and cleanup, review/approval/publication/retirement actions,
  protected preview, and recent audit feedback. `/demo` remains unchanged.
- Added four administrator resource repository tests for no-overwrite PDF upload,
  client file validation, safe hosted-error mapping, and object-before-row draft
  cleanup. The frontend suite now contains 43 tests across 16 files.
- Added the Phase 4.1 Resource Taxonomy route and typed repository/hooks/forms.
  Administrators can add, rename, describe, order, activate, and deactivate BLS
  topics and teaching stages; the page shows text-and-icon status, usage,
  publication blockers, stable slugs, and recent audit activity.
- Applied hosted migration
  `20260817025736_milestone_4_resource_taxonomy_management.sql`, which removes
  authenticated slug updates, prevents taxonomy deletion/deactivation from
  weakening publication invariants, audits taxonomy changes, and tightens
  classification replacement and publication around active labels.
- Applied follow-up migration
  `20260817032632_milestone_4_resource_taxonomy_concurrency_lock.sql`, which
  locks affected resource rows in stable order so deactivation serializes with
  concurrent publication and classification operations.
- Added 21 taxonomy pgTAP assertions and four frontend taxonomy tests. The
  complete suites now contain 164 hosted SQL/RLS assertions across six files
  and 47 Vitest tests across 18 files.
- Added atomic administrator-only question and quiz creation, draft replacement,
  immutable version branching, and publication RPCs with fixed search paths,
  explicit actor/organization checks, restricted grants, and append-only audit
  events. Direct browser writes to the authoring tables are now revoked.
- Added covering indexes for every assessment foreign key identified by the
  hosted performance advisor.
- Added the authenticated administrator Quizzes navigation entry, live quiz
  library, searchable question bank, full-page question and quiz editors,
  ordered published-question composition, fixed safe learner-review policy,
  and audited cohort post-test release controls.
- Added 29 authoring pgTAP assertions and four form-policy unit tests. The
  complete suites now contain 231 hosted SQL/RLS assertions across eight files
  and 54 Vitest tests across 20 files.

## Decisions implemented

- Learners see date, time, venue, instructor, contact, and preparation notes.
- Guides use BLS topic as the primary organization, with resource-type filters.
- Learners see score and topic summary; question review is deferred.
- The prototype includes one current cohort and historical-cohort context.
- Instructors see learner names and pre-test completion status, never answers.
- Teaching Kit uses teaching stage plus topic and type filters.
- An authorized instructor or administrator manually releases the post-test
  after the physical course. The administrator release UI is implemented;
  instructor release UI remains for a later role-workflow pass.
- Planned production exports are roster CSV, quiz results CSV, and combined
  pre-/post-test CSV.

## Latest verification status

- Milestone 6 Phase 6.4 (Audited CSV Exports) on 2026-08-19:
  - Applied forward-only corrective migration `20260819133000_milestone_6_csv_exports_corrections.sql` to hosted project `zlaixhnyydxgbphgsetv` (27 migrations total, remote and local fully aligned).
  - All 328 assertions across 12 pgTAP test files PASS on linked Supabase, including 36 assertions in `supabase/tests/database/exports.test.sql`.
  - Database lint (`npx supabase db lint --linked`) reports 0 schema errors.
  - Security definer export functions audited: narrow search path `''`, non-admin execution revoked, explicit admin same-org authorization checks.
  - Deterministic tie-breaking `qa.id DESC` enforced across all authoritative attempt queries.
  - Strict typecheck and lint pass; 112 Vitest tests pass across 26 files; production build succeeds cleanly; `git diff --check` passes.
  - Learner email contract: `learnerEmail` removed entirely from export contracts, schemas, and CSV columns because `public.profiles` does not contain email and no existing admin path exposes `auth.users.email`.
  - Ephemeral CSV generation verified: RFC-4180 compliance, formula injection defense (`=`, `+`, `-`, `@` neutralization even with leading whitespace), numeric preservation (`-12.5` remains numeric), zero-row headers, and traversal-safe filenames.
  - Audit logging: all 3 export functions write to `public.audit_events` with actor, entity ID, organization ID, export type, row count, and request ID without sensitive PII or answers in metadata.
  - Browser verification (Chrome DevTools MCP) complete:
    - Mobile (320x800), tablet (768x1024), and desktop (1440x900) verified with zero horizontal overflow, stacking cards, responsive column grids, and >=44x44px touch targets.
    - Local navigation between Results tabs and high-contrast visible focus rings verified.
    - Actual CSV downloads triggered and inspected: Cohort Roster (4 columns, no email), Pre-Test Results (10 columns, unsubmitted learners non-fabricated), Post-Test Results (10 columns), and Pre/Post Comparison (11 columns, null learning gains for unpaired learners).
    - Network RPC payloads inspected: zero private or sensitive fields returned (no emails, answers, option IDs, answer keys, or explanations).
    - Browser console inspected: zero React warnings, zero unhandled runtime errors, and zero failed RPC calls.
  - Static security/performance review completed; formal advisor execution deferred to Phase 6.5.
- Milestone 6 Phase 6.3 (Secure Question & Item Analysis) on 2026-08-19: migration `20260819120000_milestone_6_item_analysis.sql` was applied to the schema.
- Hosted `supabase test db --linked` passes all 292 assertions across 11 files, including 25 new item-analysis assertions. A flaky ordering assumption was successfully corrected without altering production logic.
- Regenerated database types compile. Strict typecheck and lint pass; 74 Vitest tests pass across 23 files; `git diff --check` passes.
- Database lint (`npx supabase db lint --linked`) reports no schema errors (only expected `pgtap`/`extensions` warnings).
- The security advisor reports the expected authenticated `security definer` warnings for the new staff RPCs.
- The performance advisor reports no missing indexes for the assessment/analytics queries.
- Milestone 5 Phase 4 (Instructor Assessment Readiness & Staff Results) on 2026-08-18: migration `20260818100000_milestone_5_staff_results.sql` was applied to the schema and successfully passed all pgTAP tests.
- The administrator attempt detail successfully reconstructs attempts from frozen snapshots, protecting historical integrity.
- Milestone 5 Phase 2 verification on 2026-08-17: migrations through
  `20260817081111_enforce_single_assessment_draft.sql` are applied to
  hosted project `zlaixhnyydxgbphgsetv`; a linked dry run identified only the
  intended Phase 5.2 migrations before application, the final dry run is
  current, and linked database lint reports no schema errors.
- Hosted `supabase test db --linked` passes all 231 assertions across eight
  files, including 29 new administrator-authoring authorization, atomicity,
  publication, immutability, and audit assertions.
- Regenerated database types compile. Strict typecheck and lint pass; all 54
  Vitest tests across 20 files pass; the production build passes with 1,851
  transformed modules and only the existing non-blocking main-chunk warning.
- Rendered live-fictional-data verification passes on quiz library, question
  bank, new-question, and new-quiz routes. At 320 and 1440 pixels, the pages
  have no horizontal overflow; route focus reaches `main`; controls and labels
  remain readable; validation focuses the prompt and exposes visible errors;
  and the browser console has no warnings or errors. No hosted assessment
  record was mutated during rendered verification.
- The security advisor reports the existing three informational no-policy
  notices, 23 expected authenticated `security definer` warnings for controlled
  RPCs (including eight new authoring RPCs), and the pre-existing leaked-
  password-protection warning. The performance advisor reports only unused-
  index information and no unindexed foreign keys.
- Post-merge deployment smoke verification for Milestone 5 Phase 2 on 2026-08-18 passed:
  the deployed GitHub Pages application loaded, Quizzes and Questions administrator
  routes were accessible, and an existing question and quiz could be inspected
  with responsive behaviour and no console errors.
- Milestone 5 Phase 1 verification on 2026-08-17: both quiz migrations are
  applied to hosted project `zlaixhnyydxgbphgsetv`; database lint reports no
  schema errors; all 202 pgTAP assertions across seven files pass, including
  the new 38-assertion quiz authorization/scoring suite.
- Regenerated database types compile. Strict typecheck and lint pass; all 50
  Vitest tests across 19 files pass; the production build passes with 1,841
  transformed modules and only the existing non-blocking main-chunk warning.
- The security advisor reports three informational no-policy notices for
  deliberately non-granted internal attempt snapshot/answer tables, expected
  authenticated `security definer` warnings for explicitly controlled RPCs,
  and the pre-existing leaked-password-protection warning. Every new RPC has a
  fixed search path, explicit grants and actor/scope checks, and pgTAP denial
  coverage. The performance advisor reports no warning-level issue.
- Fictional seed reruns now preserve a learner's existing active cohort, align
  the entitlement with it, and avoid mutating immutable published quiz child
  records. The hosted seed contains two published fictional quizzes, four
  published fictional questions, and no clinical guidance.
- Milestone 4 Phase 4.1 final verification on 2026-08-17: strict typecheck and
  lint passed; all 47 Vitest tests across 18 files passed; production build
  passed with 1,841 transformed modules and only the existing non-blocking
  main-chunk warning.
- Hosted `supabase test db --linked` passed all 164 assertions across six files,
  including all 21 taxonomy assertions. Both Phase 4.1 migrations are applied
  to project `zlaixhnyydxgbphgsetv`, and a dry run reports the hosted migration
  history is current. Regenerated `public,graphql_public` types match the
  committed generated TypeScript file.
- Rendered live-fictional-data verification passed on the administrator taxonomy
  route: all six topics and four teaching stages loaded, blocker controls and
  explanations matched assignments, add-form labels and generated-slug state
  were readable, controls measured approximately 44 pixels, 320-pixel reflow
  remained within the configured viewport, and the console had no warnings or
  errors. No hosted taxonomy record was changed during this check.
- Supabase advisors report no new Phase 4.1 security or performance finding.
  Existing intentional authenticated lifecycle-function warnings, the
  leaked-password-protection warning, and pre-traffic unused-index information
  remain unchanged.
- Milestone 4 Phase 4 final verification on 2026-08-14: strict typecheck passed;
  lint passed; all 43 Vitest tests across 16 files passed; production build
  passed with 1,836 transformed modules. The existing non-blocking main-chunk
  warning remains; PDF.js is route split.
- Hosted `supabase test db --linked` passed all 143 assertions across five files,
  including 34 administrator workflow assertions. Both Phase 4 migrations are
  applied to project `zlaixhnyydxgbphgsetv`, and generated TypeScript types match
  the hosted schema.
- Rendered local/live-data administrator verification passed after signing in as
  the fictional administrator: eight resources loaded, filters and version
  history were readable, invalid create submission focused the first field,
  current-version publication was not offered redundantly, the browser console
  had no warnings/errors, and list/version routes had no page overflow at a
  320-by-800 viewport. No hosted fixture resource was mutated during this check.
- Supabase advisors report no critical schema/RLS findings. Nine intentional
  warnings identify the authenticated `security definer` lifecycle functions;
  these are required because direct lifecycle privileges were revoked and each
  function has an empty search path, explicit active same-organization admin
  checks, restricted grants, and pgTAP coverage. Leaked-password protection
  remains disabled; performance notices are unused-index information before
  meaningful traffic.

- Post-merge deployment smoke verification on 2026-08-14 passed: the hosted
  sign-in screen loaded, the fictional instructor account reached its assigned
  cohorts, and Teaching Kit displayed all eight RLS-permitted live resources
  with readable stage/topic/type filters. The verification account was signed
  out and the browser tab was closed afterward.
- Milestone 4 Phase 3 final frontend verification: typecheck passed; lint
  passed; 39 Vitest tests across 15 files passed; production build passed with
  1,825 transformed modules. PDF.js and its worker are route split; the existing
  non-blocking main-chunk warning remains.
- Rendered hosted-data verification passed at 375 by 812 and 1440 by 900:
  learner Guides and instructor Teaching Kit each showed eight RLS-permitted
  resources, filters used readable live taxonomy labels, desktop/mobile
  navigation adapted without horizontal overflow, route focus reached main,
  and the browser console had no warnings or errors.
- Protected PDF verification passed from the approved local origin: the
  one-page fictional PDF rendered from in-memory bytes with extractable screen
  reader text and a visible user/timestamp watermark; no signed Storage URL was
  present in the DOM; logout returned to sign-in; and the final open produced
  exactly one `signed_url_authorized` plus one `signed_url_issued` event.
- Hosted `supabase test db --linked` remains green with 109 assertions across
  four files after the frontend integration. No Phase 3 database migration was
  required.

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

- Production learner, instructor, and administrator resource routes plus the
  administrator quiz-authoring routes use hosted fictional data. Authenticated
  learner quiz/result routes are not wired yet; analytics and exports remain
  illustrative or non-functional. No real learner information or clinically
  approved quiz content is present.
- Administrator catalogue and audit reads are deliberately bounded to the most
  recent 100 resources/events (and 500 versions). Cursor pagination, bulk
  operations, automated review reminders, and automated orphan cleanup remain
  deferred until real catalogue scale justifies them.
- Taxonomy usage/blocker summaries are assembled from bounded administrator
  reads of up to 500 resources and 5,000 assignments. The database invariant is
  authoritative and still blocks unsafe deactivation if a future catalogue
  exceeds those UI-summary bounds; pagination or aggregate RPCs are deferred.
- The demo role selector is intentionally separate from authentication and
  authorization.
- Post-test release, attempt timing/limits, frozen assignment, autosave,
  submission, scoring, and administrator authoring/publication are server-
  enforced. Learner attempt UI, instructor release UI, and detailed results
  administration remain for later Milestone 5 phases.
- Private resource Storage, signed access, production resource repositories,
  watermark identity, and PDF viewer wiring are implemented for fictional
  fixtures. Service-worker Cache Storage was audited directly in Phase 6.5.2A,
  confirming zero Supabase/API dynamic data caching.
- Production CSV exports (Cohort Roster, Assessment Results, and Pre/Post Comparison) are fully implemented, verified via unit/component/pgTAP suites, audited, and verified in-browser across mobile, tablet, and desktop viewports.
- Analytics are illustrative and are not calculated from persisted attempts.
- Phase 6.5.2A installable PWA baseline and conservative application-shell caching
  are complete; authenticated data remains online-only and fail-closed.
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

## Exact recommended next action

Proceed to Milestone 6 Phase 6.5.2B2A: Hosted Provisioning Infrastructure Deployment & Verification (deploying the amended migration `20260820090000_milestone_6_user_provisioning_transaction.sql`, deploying the hardened `admin-invite-user` Edge Function, configuring remote secrets, and verifying hosted authorization without creating or inviting users).
