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

## ADR-017 — Roster-before-auth identity intent and 7-day invitation lifecycle

### Decision

Decouple participant roster intent from immediate `auth.users` provisioning. Store intended participant emails in `cohort_learner_roster` and manage a 7-day application invitation lifecycle in `access_invitations`. Staff enter email only; learners submit their full name, I.C., preferred language, and password during registration. Interpose an explicit landing page to prevent email scanners from consuming one-time tokens. Resending an invitation generates a fresh token and supersedes the prior invitation.

### Rationale

- Staff frequently receive only a participant email roster prior to a physical course. Requiring full names up front causes operational friction and data-entry errors.
- Default Supabase Auth email tokens have short expirations that expire prematurely for course participants invited days in advance. Blindly extending all auth tokens weakens session security.
- Modern enterprise email security scanners prefetch and consume single-use authentication links.
- Returning users must not be forced to re-register personal data or change passwords.

### Consequence

Invitation redemption requires an intermediary verification step before transitioning profiles to `pending_registration` and finally `active`. The database must track invitation states (`prepared`, `sent`, `redeemed`, `expired`, `superseded`) independently from Auth session state.

## ADR-018 — Multi-course cohort join model and expand-backfill-contract migration

### Decision

Migrate from a single `cohorts.course_id` column to a many-to-many join table `cohort_courses`. Every learner enrolled in a cohort automatically receives course entitlements for every course attached to that cohort. Execute the migration via an expand-backfill-contract strategy: create `cohort_courses`, backfill existing pairs, update access helpers to read `cohort_courses`, make `cohorts.course_id` nullable, and drop the legacy column after production parity is verified.

### Rationale

- Physical BLS course offerings often combine complementary certifications (e.g., Adult BLS, Pediatric BLS, and AED Essentials) within a single training cohort.
- Direct destructive column replacement would break active production queries and RLS helpers.
- Operational policy mandates that all learners in a cohort receive all cohort courses, avoiding per-learner enrollment picker complexity in Milestone 7.

### Consequence

Access helpers (`has_effective_course_access`, `is_assigned_instructor_for_course`), quiz availability functions, and cohort administration UI must query across `cohort_courses`.

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

## ADR-021 — Protected National Identity (I.C.) data boundary and role-based masking

### Decision

Store Malaysian Identity Card (MyKad) numbers in a dedicated, isolated table `public.learner_identities` rather than the general `public.profiles` table. Deny SELECT access to `authenticated` public and `instructor` roles. Allow full I.C. visibility only to `super_admin`, `admin`, and the learner themselves. Provide instructors with a masked projection (`******-**-1234`) via a secure view or RPC. Strictly prohibit logging or auditing full I.C. values.

### Rationale

- National identity numbers are sensitive personal data under privacy standards.
- Instructors need identity verification for attendance and practical verification but have no operational requirement to view or store full national identity numbers.
- Segregating sensitive identity data prevents accidental disclosure in broad profile queries or browser payloads.

### Consequence

Roster displays for instructors show only masked identifiers. Full identity retrieval is restricted to administrative workflows with audit tracking.
