# AGENTS.md

This file defines operating rules for coding agents working on the BLS Learning PWA repository.

## Project objective

Build a secure, accessible, responsive companion PWA for physical Basic Life
Support courses. It supports learners attending an in-person course,
instructors delivering it, and administrators managing people, cohorts,
resources, quizzes, results, access, and auditability. It is not a self-paced
LMS.

## Continuity requirements

Before planning or implementing changes, read:

- `docs/PRODUCT_DIRECTION.md`
- `docs/HANDOFF.md`
- `PLAN.md`

Treat `docs/PRODUCT_DIRECTION.md` as the canonical product brief when older
documents conflict with it.

Update `docs/HANDOFF.md` whenever:

- A milestone ends.
- The product direction changes.
- Work pauses pending a user decision.

The handoff must state the latest verification status, known limitations,
unresolved decisions, and exact recommended next action.

## Non-negotiable architecture

- Frontend: React, TypeScript, and Vite
- Hosting: GitHub Pages
- Backend: Supabase
- Authentication: Supabase Auth
- Database: Supabase PostgreSQL
- Authorization: Row Level Security and server-side functions
- Storage: private Supabase Storage buckets
- Privileged operations: Supabase Edge Functions or carefully controlled database functions
- PWA: safe application-shell caching only
- Testing: Vitest, React Testing Library, Playwright, and SQL/RLS tests

Do not introduce a custom application server for the initial release without an approved architecture decision.

## Security rules

1. Never place secret keys, service-role keys, database passwords, or external service credentials in frontend code.
2. Do not rely on route guards or hidden UI for authorization.
3. Enable and test RLS for every browser-accessible table.
4. Do not expose correct quiz answers before submission.
5. Do not permit learners to insert or alter final scores.
6. Do not cache protected resources, signed URLs, assessment answers, or user exports in the service worker.
7. Do not make protected Storage buckets public.
8. Administrative Auth operations must run in a trusted environment.
9. Historical quiz attempts and question versions must remain immutable.
10. Administrative changes must create audit events.

## Data rules

- Use UUID primary keys.
- Use `timestamptz` for timestamps.
- Use database constraints for invariants.
- Use migrations for all schema changes.
- Use explicit version records for published course content and questions.
- Avoid destructive updates to records that are referenced historically.
- Use transactions for multi-row reorder operations.
- Generate TypeScript database types from the schema.
- Prefer normalized relational data over large JSON blobs, except for immutable snapshots or structured event payloads where justified.

## Frontend rules

- Use TypeScript strict mode.
- Use feature-based folder organization.
- Use TanStack Query for server state.
- Use React Hook Form and Zod for forms and validation.
- Use shadcn/ui components and Radix primitives where practical.
- Use design tokens rather than inline colour values.
- Build responsive mobile and desktop behaviour intentionally.
- Maintain keyboard accessibility and visible focus states.
- Use loading, empty, error, offline, access-denied, and expired-access states.
- Do not show raw database or Supabase error messages to learners.

## UI rules

- Learner navigation should remain simple.
- Learner and instructor experiences are mobile-first.
- Learner navigation is Home, Guides, Quiz, and Profile.
- Instructor navigation is Home, Teaching Kit, Cohorts, and Profile.
- Desktop learner and instructor layouts may use an adaptive sidebar.
- Mobile learner and instructor layouts should use a compact top bar and bottom navigation.
- Admin screens should use a desktop-first sidebar with responsive drawers or cards.
- Admin navigation is Overview, People, Cohorts, Resources, Quizzes, Results, and Settings.
- Resources should be reachable within one or two taps where practical.
- Do not introduce module-completion pathways, continue-learning dashboards, or gamification without an approved product-direction change.
- Minimum practical touch target is approximately 44 by 44 pixels.
- Avoid overusing dialogs for complex editing. Use drawers or full pages for question and course editors.
- Use status badges consistently.
- Do not use colour as the only signal for pass, fail, warning, or completion.

## Quiz rules

- Start attempts through a controlled RPC or Edge Function.
- Freeze the assigned question versions for each attempt.
- Store autosaved answers separately from final scoring.
- Calculate final scores server-side.
- Make submission idempotent.
- Prevent post-submission answer changes.
- Respect attempt limits, expiry, prerequisites, and quiz windows on the server.
- Apply quiz review policy before revealing answers or explanations.

## Resource rules

- Store PDFs in a private bucket.
- Issue short-lived access only after validating entitlement.
- Remove normal download and print controls from the viewer.
- Use dynamic visible watermarking.
- Track meaningful engagement, not excessive mouse or scroll events.
- Do not claim absolute copy prevention.
- Treat YouTube unlisted URLs as obscured, not secure.
- Keep the video-hosting layer replaceable for future migration.

## Code quality

Before considering a change complete:

- Typecheck passes.
- Lint passes.
- Relevant unit tests pass.
- Relevant component tests pass.
- Relevant Playwright tests pass.
- Database migrations rebuild successfully.
- RLS tests pass.
- No secrets are introduced.
- Documentation is updated when behaviour or architecture changes.

## Change discipline

- Keep changes scoped to the requested task.
- Do not reformat unrelated files.
- Do not rename tables, routes, or public interfaces without an approved migration plan.
- Add a changelog entry for user-visible or architecture-significant changes.
- Add or update an architecture decision record when a major dependency or pattern changes.
- Prefer reversible migrations.
- Never alter production data during documentation-only tasks.

## Completion report

At the end of an implementation task, report:

1. Files changed
2. Behaviour added or changed
3. Database migrations added
4. Tests run and results
5. Security implications
6. Known limitations
7. Manual verification steps
