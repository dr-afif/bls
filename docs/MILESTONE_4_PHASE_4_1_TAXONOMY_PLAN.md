# Milestone 4 Phase 4.1 — Resource Taxonomy Management

## Status

Implemented and verified on 2026-08-17 against the fictional hosted development
project. The branch still requires review, commit, push, pull-request CI, and a
deployed administrator smoke test.

## Outcome

Allow active same-organization administrators to maintain the BLS topics and
teaching stages used for resource discovery without deleting historical
classifications or weakening published-resource invariants.

## Scope

### Included

- Add organization-scoped BLS topics and teaching stages.
- Edit names, descriptions, and display order.
- Generate a stable slug at creation and prevent browser-side slug changes.
- Activate or deactivate taxonomy items; do not delete them.
- Preserve and visibly label inactive historical assignments.
- Show assignment, published-use, and publication-blocker counts.
- Prevent deactivation when it would remove the last active topic from a
  published resource or the last active stage from a published instructor
  resource.
- Audit create, edit, activation, and deactivation events.
- Keep new resource assignments limited to active taxonomy.

### Excluded

- Destructive taxonomy deletion or slug migration.
- Bulk import, drag-and-drop reordering, or cursor pagination.
- Cross-organization taxonomy sharing.
- Quiz, result, analytics, or certificate taxonomy.
- Real learner or clinical data.

## Implementation

1. Apply scoped reversible migrations that harden grants, add private trigger
   functions, record safe audit metadata, tighten classification/publication
   around active taxonomy, and serialize deactivation with resource lifecycle
   changes by locking the same parent resource rows.
2. Add pgTAP coverage for administrator writes, learner denial,
   cross-organization isolation, stable slugs, audit events, inactive
   assignment behavior, and publication-safe deactivation.
3. Add a typed taxonomy repository, pure catalog assembler, TanStack Query
   hooks, React Hook Form and Zod forms, and a dedicated full-page admin route
   at `/app/admin/resources/taxonomy`.
4. Integrate inactive labels into resource list/detail history while limiting
   new assignments to active labels.
5. Verify strict TypeScript, lint, Vitest, production build, hosted pgTAP,
   generated types, advisors, and rendered 320-pixel behavior.

## Security boundaries

- UI visibility is not authorization. Existing RLS limits reads and writes to
  active administrators in their organization.
- Taxonomy records cannot be deleted through browser grants, and slugs cannot
  be updated by authenticated clients.
- Database triggers, not UI button state, block unsafe deactivation.
- Publication and atomic classification replacement revalidate active taxonomy
  on the server.
- Trigger functions use `security definer`, an empty search path, private
  schema placement, and no direct browser execute grant.
- Audit actors are derived from `auth.uid()`; clients do not supply them.

## Verification result

- Strict typecheck: passed.
- ESLint: passed.
- Vitest: 47 tests across 18 files passed.
- Production build: passed; 1,841 modules transformed. The existing
  non-blocking main-chunk warning remains.
- Hosted pgTAP: 164 assertions across six files passed after both Phase 4.1
  migrations, including 21 taxonomy assertions.
- Hosted generated `public,graphql_public` TypeScript types: unchanged and
  matched the committed file.
- Security advisor: no new Phase 4.1 finding; existing intentional controlled
  lifecycle-function warnings and leaked-password-protection warning remain.
- Performance advisor: informational unused-index notices only.
- Rendered administrator page: live fictional taxonomy loaded; semantic
  heading hierarchy, text-and-icon statuses, 44-pixel controls, form labels,
  blocker explanations, and small-screen reflow were verified without console
  warnings or errors. No hosted record was mutated during the rendered check.

## Manual review

1. Sign in locally as the fictional administrator.
2. Open `#/app/admin/resources`, then choose **Manage topics & stages**.
3. Confirm both taxonomy sections, status badges, usage counts, and blocked
   deactivation explanations are readable at desktop and 320-pixel widths.
4. Open add and edit forms and confirm validation, slug behavior, keyboard
   focus, and cancellation without saving.
5. In the fictional development environment only, add a disposable label,
   edit and deactivate it, confirm its audit entries, then reactivate it.
6. Confirm learner/instructor accounts cannot open the administrator route.

## Rollback

Revert the frontend route and taxonomy feature files. If database rollback is
required, use a new migration to remove the Phase 4.1 triggers/functions and
restore the prior public function definitions; do not edit or delete the
already-applied migration or taxonomy data.
