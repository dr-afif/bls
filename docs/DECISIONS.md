# Architecture Decisions

## ADR-001 — React, TypeScript, and Vite

### Decision

Use React with TypeScript strict mode and Vite.

### Rationale

- Suitable for a responsive authenticated SPA
- Strong component ecosystem
- Fast development workflow
- Straightforward static deployment
- Good PWA support
- No requirement for server rendering in the initial release

### Consequence

Public SEO is not a primary focus. The application depends on client-side rendering.

## ADR-002 — GitHub Pages for initial frontend hosting

### Decision

Host the static frontend on GitHub Pages.

### Rationale

- Fits the user's preferred workflow
- Integrates with GitHub Actions
- Sufficient for a static SPA
- Low operational burden

### Consequence

SPA routing and response-header control require workarounds. The codebase should remain easy to migrate to Cloudflare Pages.

## ADR-003 — Supabase for backend services

### Decision

Use Supabase Auth, PostgreSQL, Storage, Row Level Security, and Edge Functions.

### Rationale

- Integrated authentication and database
- Strong relational model
- Browser-safe access when combined with RLS
- Private file storage
- Serverless functions for privileged actions

### Consequence

RLS quality is critical. Database migrations and tests must be disciplined.

## ADR-004 — shadcn/ui and Radix primitives

### Decision

Use shadcn/ui components built on accessible primitives.

### Rationale

- Source-controlled components
- High customizability
- Good accessibility foundation
- Avoids rigid vendor theming

### Consequence

The project owns component maintenance and must preserve accessibility when customizing.

## ADR-005 — TanStack Query for server state

### Decision

Use TanStack Query for remote data.

### Rationale

- Query caching
- Mutation invalidation
- Pagination
- Loading and error state management
- Avoids unnecessary global-state complexity

### Consequence

Query keys and invalidation rules must be documented and consistent.

## ADR-006 — Private Storage and temporary PDF access

### Decision

Store PDFs in a private Supabase Storage bucket and issue temporary access only after entitlement validation.

### Rationale

- Prevents public direct URLs
- Supports revocation and expiry
- Supports audit logging
- Fits controlled viewer design

### Consequence

Absolute copy prevention remains impossible.

## ADR-007 — Unlisted YouTube for initial video hosting

### Decision

Use unlisted YouTube videos for the first release.

### Rationale

- Simple upload workflow
- Reliable playback
- Low cost
- Official embed API

### Consequence

Unlisted links are not secure. Future migration to tokenized streaming may be needed.

## ADR-008 — Server-side quiz scoring

### Decision

Calculate quiz results in PostgreSQL functions or Edge Functions.

### Rationale

- Prevents client tampering
- Allows consistent timing and attempt rules
- Keeps correct answers out of learner payloads

### Consequence

Quiz APIs must be carefully designed and tested for idempotency.

## ADR-009 — Immutable question and resource versions

### Decision

Published content used historically must be versioned rather than overwritten.

### Rationale

- Preserves historical accuracy
- Supports audit and clinical review
- Keeps old attempts interpretable

### Consequence

Administration becomes more complex but safer.

## ADR-010 — Online-first PWA

### Decision

Cache only the application shell and safe static assets.

### Rationale

- Protected resources should not remain offline
- Quiz integrity requires server checks
- Reduces sensitive browser storage

### Consequence

Protected learning requires an active connection.

## ADR-011 — Feature-based frontend structure

### Decision

Organize code by feature, with shared UI primitives and application components.

### Rationale

- Keeps domain logic together
- Scales better than generic pages and services folders
- Improves test locality

### Consequence

Shared abstractions should not be created prematurely.

## ADR-012 — WCAG 2.2 AA target

### Decision

Build toward WCAG 2.2 AA from the beginning.

### Rationale

- Healthcare education should be broadly accessible
- Retrofitting accessibility is expensive
- Timed quizzes and media require deliberate accommodations

### Consequence

Accessibility is part of acceptance, not optional polish.

## ADR-013 — In-person BLS course companion product direction

### Decision

BLS Learning is a companion application for physical Basic Life Support
courses. It is not a self-paced LMS.

- Learners use a mobile-first experience for cohort information, practical
  guides, pre-/post-tests, and personal results.
- Instructors use a mobile-first teaching toolkit for course materials and
  relevant cohort context.
- Administrators use a desktop-first responsive experience for people, cohorts,
  resources, quizzes, results, exports, and access status.
- Resources are organized for quick reference and teaching use rather than
  sequential online completion.
- The frontend prototype and information-architecture validation precede
  backend implementation.
- Authentication, authorization, protected data handling, secure scoring, and
  audit controls are mandatory when real user data is introduced.

### Rationale

- The application supports an instructor-led physical course.
- Learners and instructors need fast access to operational information and
  materials, frequently on mobile devices.
- LMS-style progress dashboards and learning pathways misrepresent the actual
  service.
- Separating prototype validation from backend implementation reduces the risk
  of encoding an unapproved product model into the data and authorization
  layers.

### Consequence

The existing frontend foundation may be reused, but its dashboard, course
pathway, completion metrics, and continue-learning hierarchy must be replaced
after the user approves a revised visual direction. Production security
requirements remain deferred only while data is fictional and local.

## ADR-014 — Retain the current component system and Tailwind CSS v3

### Decision

Do not adopt HeroUI React v3 or migrate from Tailwind CSS v3 to Tailwind CSS v4
for the current production milestone. Continue using the source-owned
shadcn-style components, Radix primitives where practical, Lucide icons, and
the existing semantic design tokens. Do not use HeroUI Native.

### Rationale

- The validated prototype uses a small component surface that is already
  source-controlled, accessible, tested, and visually aligned with the product.
- HeroUI React v3 requires Tailwind CSS v4, so adoption would combine two major
  migrations without a validated product need.
- HeroUI v3 is a recent rewrite and its early v3 releases have included breaking
  component changes, increasing migration and maintenance risk during backend
  development.
- Tailwind CSS v4 raises the supported-browser floor to Safari 16.4, Chrome 111,
  and Firefox 128. Institutional browser requirements have not yet been
  confirmed.
- The likely benefits—more packaged components and React Aria behavior—do not
  currently outweigh dependency growth, retesting effort, and loss of the
  existing component ownership model.

### Consequence

Milestone 2 proceeds without a visual-system migration. Reconsider HeroUI React
only if later production screens reveal a concrete component gap or a separate
dependency-review milestone is approved. At that point, confirm browser support
and use the HeroUI React MCP server before running a migration spike.

## ADR-015 — Conservative MVP authorization and review policies

### Decision

Adopt the MVP quiz-review, cohort-membership, post-test-release, export, and
audit rules in `PRODUCTION_POLICY_DECISIONS.md`.

### Rationale

- Withholding answer keys minimizes assessment-integrity risk.
- One active learner cohort matches the validated current-plus-history product
  model while allowing instructors to teach multiple cohorts.
- Assigned-instructor release supports physical-course delivery without giving
  instructors broad administrative access.
- Administrator-only exports minimize disclosure while the first reporting
  authorization model is established.
- Server enforcement and append-only audit records are required before these
  operations handle real users.

### Consequence

The initial data model and RLS tests can use explicit authorization rules.
Broader review, membership, release, or export behavior requires a later
decision and corresponding migration and security tests.

## ADR-016 — Authenticated Edge Function for temporary PDF access

### Decision

Issue protected PDF access through a Supabase Edge Function using the current
`@supabase/server` user-auth wrapper with platform JWT verification enabled.
The function receives a verified user JWT, delegates authorization and rate
limiting to service-only database logic, signs only the authorized object path,
records append-only access events, and returns a 60-second non-cacheable URL.

Keep `course-resources` private. Browser roles receive no broad Storage select,
update, delete, list, move, or copy access. Administrators may insert only the
exact path of a matching same-organization draft PDF version.

### Rationale

- The static GitHub Pages frontend cannot safely hold a secret key.
- Database-backed authorization keeps account, role, entitlement, cohort,
  audience, availability, organization, and version checks consistent.
- Short expiry, rate limiting, idempotency, and audit events reduce link-sharing
  and abuse risk without claiming absolute copy prevention.
- Current Supabase guidance separates the browser publishable key in `apikey`
  from the signed-in user's JWT in `Authorization` and recommends the
  `@supabase/server` wrapper for new functions.

### Consequence

Protected PDFs require a network connection. Signed links remain bearer
credentials during their short lifetime and cannot prevent screenshots or a
recipient from copying content after retrieval. The service worker and
application caches must exclude protected responses and URLs.

## ADR-017 — Pre-Auth authorization intent, invitation-to-target integrity, and 7-day invitation lifecycle

### Decision

Decouple authorization intent from immediate `auth.users` provisioning for both learners and staff:
1. **Learner Intent**: Record intended cohort participants in `public.cohort_learner_roster(id, organization_id, cohort_id, email, roster_status, user_id, added_by)`.
2. **Staff Intent**: Record organization staff authorization intent in `public.staff_access_entries(id, organization_id, email, intended_role, status, user_id, added_by)`. Super-admins may stage admins or instructors; admins may stage instructors only; no standard workflow may stage super-admins. Removal sets status to `removed` and never deletes established user accounts.
3. **Invitation Referential Integrity**: Each row in `public.access_invitations` represents an individual invitation attempt and must reference exactly one authorization intent target via foreign keys (`cohort_roster_entry_id` or `staff_access_entry_id`) with a CHECK constraint enforcing exclusivity. The invitation row is an attempt record, not the intent source of truth.
4. **Foreign Key Nullability**: All actor references (`added_by`, `invited_by`, `created_by`, `redeemed_by_user_id`) must be nullable with `ON DELETE SET NULL`. Immutable actor provenance is preserved in append-only `public.audit_events`.
5. **Token Security & Lifecycle**: High-entropy cryptographic secrets; stored in database only as SHA-256 hashes (`token_hash`); raw tokens exist only in transient delivery URLs and are scrubbed immediately from browser URL/history via `history.replaceState`. Interpose an explicit intermediary landing page to protect against premature token redemption by automated email security scanners. Resending an invitation generates a fresh token and supersedes prior attempts atomically.
6. **Server-Derived Effective Expiry**: Invitation validity is governed by `effective_expired = (status = 'sent' AND expires_at <= now())` enforced dynamically in all redemption RPCs and query projections, eliminating dependency on background cron jobs.

### Rationale

- Staff frequently receive only participant or colleague email lists prior to course setup. Requiring personal details up front causes operational friction and data-entry errors.
- Separating authorization intent entities from invitation attempt records ensures intent survives failed or resent invitations.
- Default Supabase Auth email tokens expire prematurely for physical courses scheduled days or weeks in advance; 7-day application-level tokens solve this cleanly.
- Enforcing nullable actor foreign keys prevents database constraint conflicts with `ON DELETE SET NULL`.
- Modern enterprise email security scanners prefetch and consume single-use authentication links; an explicit user-initiated POST on an intermediary landing page defends against bot redemption.

### Consequence

Invitation redemption requires an intermediary verification step before transitioning profiles to `pending_registration` and finally `active`. The database tracks invitation states (`prepared`, `sent`, `redeemed`, `expired`, `superseded`) independently from Auth session state.

## ADR-018 — Multi-course cohort join model and optional per-course schedule overrides

### Decision

Migrate from a single `cohorts.course_id` column to a many-to-many join table `cohort_courses`. Every learner enrolled in a cohort automatically receives course entitlements for every course attached to that cohort.

Extend `cohort_courses` with optional schedule and venue overrides:
- `start_at timestamptz NULL`
- `end_at timestamptz NULL`
- `venue text NULL`
- Table constraint: `CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)`

**Resolution Semantics**:
- When override columns are NULL, child courses inherit the parent `cohorts` start time, end time, and venue.
- When specified, course-specific values take precedence in invitation displays, learner itineraries, and course agendas.
- Courses within a cohort may have different schedules without creating duplicate cohorts.

Execute the database migration via an expand-backfill-contract strategy: create `cohort_courses`, backfill existing pairs, update access helpers to read `cohort_courses`, make `cohorts.course_id` nullable, and drop the legacy column after production parity is verified.

### Rationale

- Physical BLS course offerings often combine complementary certifications (e.g., Adult BLS, Pediatric BLS, and AED Essentials) within a single training cohort, where components may occur at distinct times or rooms.
- Direct destructive column replacement would break active production queries and RLS helpers.
- Operational policy mandates that all learners in a cohort receive all cohort courses, avoiding per-learner enrollment picker complexity in Milestone 7.

### Consequence

Access helpers (`has_effective_course_access`, `is_assigned_instructor_for_course`), quiz availability functions, and cohort administration UI must query across `cohort_courses`, resolving schedule overrides where present.

## ADR-019 — Reversible cohort learner-access gate (`learner_access_state`)

### Decision

Introduce an explicit `learner_access_state` enum (`open`, `closed`) on `public.cohorts`, defaulting to `open`. Allow administrators and super-administrators to close or restore learner access without deleting accounts, memberships, entitlements, or historical attempt records. Effective course access checks require `learner_access_state = 'open'`.

### Rationale

- Course administrators require the operational ability to close cohort access after physical training concludes, or restore it for delayed assessments or audits.
- Destructively revoking entitlements or deleting memberships destroys historical auditability and prevents clean re-entry.
- Decoupling learner access state from operational cohort status (`scheduled`, `active`, `completed`) preserves clean state machines.

### Consequence

Closing access does not lock out learner accounts from their profiles or past score reports; it cleanly gates access to active learning guides and quiz attempts. Both close and restore actions generate immutable audit events.

## ADR-020 — Bilingual (EN/MS) translation framework and authored content localization

### Decision

Support English (`en`, default and fallback) and Bahasa Melayu (`ms`) across the application. Use client-side translation dictionaries (`useTranslation()`) rather than duplicate component trees. Store user language preference in `profiles.preferred_language`. Provide bilingual (EN + BM) onboarding emails. Prohibit runtime machine translation for clinical content: educational resources and versioned quiz questions must be authored in both languages, with both variants frozen immutably in question version and attempt snapshots.

### Rationale

- Malaysian healthcare workers and trainees operate in both English and Bahasa Melayu.
- Clinical life support terminology requires precise, committee-approved human translations; runtime machine translation risks dangerous inaccuracies.
- Freezing both language prompts within immutable question versions ensures historical assessment auditability cannot drift over time.

### Consequence

Frontend components must reference translation keys. Educational content authoring workflows must support bilingual text fields.

## ADR-021 — Private schema National Identity (I.C.) boundary, safe uniqueness, and role-based masking

### Decision

Isolate sensitive National Identity numbers within a dedicated private table `private.learner_identities` rather than the public schema or `public.profiles`:
1. **Schema Boundary**: Direct SELECT privilege on `private.learner_identities` is denied to all browser roles (`anon`, `authenticated`).
2. **Controlled Access RPCs**: Controlled `SECURITY DEFINER` functions with locked `SET search_path = ''`:
   - `learner`: reads own identity via `get_my_learner_identity()`, updates via `update_my_learner_identity()`.
   - `admin` / `super_admin`: reads full identity within authorized organization scope via `get_learner_identity_for_admin()`.
   - `instructor`: accesses assigned cohort roster with masked identifier (`******-**-1234`) via `get_cohort_roster_for_instructor()`. Full identity values never enter instructor network payloads or client state.
3. **Server-Derived Masking**: Masked identifiers are computed dynamically on the server (`'******-**-' || right(id_number, 4)` for MyKad) rather than stored as redundant mutable columns.
4. **Supported Identity Types & Normalization**:
   - `mykad`: normalized strictly to 12 digits (`^\d{12}$`) stripping all hyphens and whitespace.
   - `passport`: normalized to trimmed uppercase alphanumeric (`^[A-Z0-9-]{6,20}$`).
5. **Safe Duplicate Protection**: Database unique constraint `UNIQUE (id_type, id_number)`. Duplicate registration fails safely with generic error messaging to prevent identity enumeration. Full identity values are strictly excluded from audit logs, server error messages, and browser logs.

### Rationale

- National identity numbers are sensitive personal data under privacy standards and regulations.
- Instructors need identity verification for attendance and practical verification but have zero operational justification to view or store full national identity numbers.
- Segregating sensitive identity data into a private schema prevents accidental exposure in broad profile queries, GraphQL/PostgREST table auto-reflection, or frontend serialization.
- Server-side dynamic derivation of masked identifiers eliminates data desynchronization bugs.

### Consequence

Roster displays for instructors show only masked identifiers. Full identity retrieval is restricted to administrative workflows with audit tracking.

## ADR-022 — Existing-user enrollment timing, passwordless return flow, and email transport technical spike

### Decision

1. **Authoritative Existing-User Enrollment Timing**:
   - Staging on cohort roster records intended participation only (grants no access).
   - Sending an invitation for an existing active user immediately validates actor/cohort, activates/restores `cohort_members`, creates/synchronizes `course_entitlements` for all attached cohort courses, dispatches the notification email, and writes audit events.
   - The existing user does NOT need to open the email to access the cohort if they log into the webapp independently.
   - Suspended or archived accounts are never silently reactivated.
2. **One-Time Passwordless Return Flow**:
   - Invitation email delivers a 7-day link to an intermediary landing page.
   - When the existing user clicks the human confirmation button, the server validates the invitation token, confirms email identity, and generates a fresh short-lived Supabase Auth token (via `auth.admin.generateLink`).
   - The browser exchanges the token hash via `supabase.auth.verifyOtp` to establish an authenticated session directly into the application.
   - The user enters the application without re-entering their old password; their existing password is NOT changed. Optional password reset remains available through profile settings.
3. **Prerequisite Technical Spikes**:
   - **Email Transport Spike (Phase 7.3)**: Supabase Auth Custom SMTP is managed by GoTrue and cannot be assumed to send arbitrary Edge Function application emails. A dedicated technical spike must evaluate and verify the safest server-side mail transport (e.g. server-side SMTP library reusing verified credentials vs. HTTP provider API) supporting dynamic bilingual HTML/text, multi-course payloads, and testability before invitation implementation.
   - **Passwordless Return Link Spike (Phase 7.5)**: Verify exact Supabase `auth.admin.generateLink` / `verifyOtp` semantics in Edge Functions and frontend auth callbacks.

### Rationale

- Existing learners who are re-invited should not be blocked from accessing course materials if they simply sign in to the app directly.
- Requiring returning learners to recall passwords from months ago creates support friction during physical course registration. A verified one-time link provides a smooth return experience while preserving their existing password.
- Documenting technical spikes prevents unvalidated assumptions about platform capabilities from breaking implementation schedules.

### Consequence

Phase 7.3 cannot proceed to invitation implementation without completing the Email Transport Spike. Phase 7.5 must execute the return link spike before finalizing the returning user flow.
