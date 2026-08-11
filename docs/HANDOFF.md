# Development Handoff

## Last updated

2026-08-07

## Current milestone

Milestone 1 is complete using owner-accepted proxy validation. Milestone 2
production architecture and authentication planning is active.

## Current repository state

- React, TypeScript, Vite, Tailwind, React Router, and Vitest frontend.
- Distinct learner, instructor, and administrator route trees and shells.
- Fictional local data behind small repository interfaces.
- Clinical Field Guide styling for learner and instructor screens.
- Compact Operational Course Companion density for administrator screens.
- No backend, real authentication, real users, protected content, persistence,
  secure scoring, or real exports.

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

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed (10 tests).
- `npm run build`: passed (1,620 modules transformed).
- The documentation-only milestone updates and initial backend files were
  followed by successful typecheck, lint, 10 frontend tests, and production
  build on 2026-08-07.
- Local Supabase database verification is pending: Supabase CLI 2.111.0 hung
  before creating the Postgres container in both full-stack and Postgres-only
  startup attempts. Docker Desktop itself was healthy, and no migration SQL
  error was emitted. Generated database types therefore remain pending.
- Local Markdown-link validation: passed.
- Rendered browser and source inspections completed at 320×800, 375×812, 1024×768, and 1440×900 viewports.
- Checks covered learner, instructor, and administrator headers; route focus to main content; skip navigation accessibility; presentation-view activation and Escape exit; invalid route heading hierarchy; horizontal reflow at 320px; and console warnings/errors.
- Identified and corrected two objective UI defects: proper semantic `h1` usage for the standalone not-found route, and compacting the prototype/demo data tags into a space-efficient mobile header row without page-level horizontal overflow.

## Exact recommended next action

Resolve the local Supabase CLI startup hang, then run `supabase db reset`,
`supabase test db`, the database advisors, and TypeScript type generation.
Review and fix every migration or RLS failure before adding the browser client
or connecting real user data.

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

- All data and state are local, fictional, and reset on reload.
- The demo role selector is not authentication or authorization.
- Post-test release, quiz security, scoring, access expiry, and route visibility
  are not server-enforced.
- Resource viewers do not provide protected storage, signed URLs, watermark
  identity, or copy prevention.
- Export buttons never generate files.
- Analytics are illustrative and are not calculated from persisted attempts.
- PWA offline caching and install behavior are not part of this milestone.
- The initial database migration and RLS tests have not yet executed because
  the local Supabase CLI hung before creating a database container.
- The installed UI/UX skill package references a missing design-system
  generator, so its documented design and accessibility rules were applied
  directly.
