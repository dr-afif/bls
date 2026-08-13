# Development Handoff

## Last updated

2026-08-13

## Current milestone

Milestone 1 is complete using owner-accepted proxy validation. Milestone 2 now
includes the verified identity/access database foundation and the frontend
authentication/account-access slice. Real course data is the next milestone.

## Current repository state

- React, TypeScript, Vite, Tailwind, React Router, and Vitest frontend.
- Distinct learner, instructor, and administrator route trees and shells.
- Fictional local data behind small repository interfaces.
- Clinical Field Guide styling for learner and instructor screens.
- Compact Operational Course Companion density for administrator screens.
- Hosted Supabase development database with the initial identity/access schema,
  explicit grants, RLS policies, fictional organization seed, and generated
  TypeScript types. The frontend now connects through validated public
  configuration for invite-only sign-in, recovery, session restoration, and
  RLS-backed profile/role checks. There are no real users, protected content,
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
- `npm run test`: passed (14 tests across 9 files).
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
- Hosted security advisor: zero findings.
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

## Exact recommended next action

Have a repository owner change GitHub Pages **Build and deployment → Source** to
**GitHub Actions**, and have a Supabase project owner configure the local and
GitHub Pages Auth redirect URLs. Merge PR #1, confirm the Pages workflow, then
smoke-test the password-recovery callback on the deployed site. After that,
design the cohort/entitlement/resource schema slice before replacing any mock
repository.

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

- Learning, cohort, resource, quiz, result, and administrative data remains
  local and fictional; only authentication plus profile/role bootstrap is live.
- The demo role selector is intentionally separate from authentication and
  authorization.
- Post-test release, quiz security, scoring, access expiry, and route visibility
  are not server-enforced.
- Resource viewers do not provide protected storage, signed URLs, watermark
  identity, or copy prevention.
- Export buttons never generate files.
- Analytics are illustrative and are not calculated from persisted attempts.
- PWA offline caching and install behavior are not part of this milestone.
- The local Docker-based Supabase stack remains unavailable, so database
  verification currently uses the hosted fictional development project.
- The Supabase MCP connector still has stale project permissions, but the
  authenticated Supabase CLI can access the project and completed migration,
  testing, advisor, query, and type-generation operations.
- The installed UI/UX skill package references a missing design-system
  generator, so its documented design and accessibility rules were applied
  directly.
- Password recovery requires the deployed and local callback URLs to be added
  to Supabase Auth configuration.
- Password recovery remains unverified because the connected Supabase
  collaborator receives HTTP 403 for Auth configuration changes. A project
  owner must set the Site URL to `https://dr-afif.github.io/bls/` and allow
  `http://127.0.0.1:5173/**`, `http://localhost:5173/**`, and
  `https://dr-afif.github.io/bls/**`.
- GitHub Pages remains on the legacy `main`-branch publishing source. The
  connected collaborator can push code and set repository variables but cannot
  change the Pages source through the repository administration API. A
  repository owner must select **GitHub Actions** before the new deployment
  workflow can publish the Vite build.
- `npm audit` reports two moderate React Router 6 advisories. The remaining
  supported fix is a breaking React Router 7 migration; the current app is
  client-side only and constrains post-login redirects to internal paths.
- The shared test password is intentionally temporary and weak. Replace it with
  unique generated passwords before any broader testing and never reuse these
  accounts for real learner information.
- The OneDrive workspace's `.git` directory remains an inaccessible cloud
  reparse point to command-line Git even though the visible project files are
  hydrated. PR #1 was published from a verified temporary clone outside
  OneDrive. Repair or replace the workspace checkout before the next Git-based
  development session.
