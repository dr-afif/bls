# Milestone 4 Phase 4 — Administrator Resource Workflow

## Outcome

Replace the authenticated administrator Resources placeholder with a secure,
auditable workflow for maintaining resource metadata, classifications,
immutable content versions, private PDF files, clinical review, publication,
retirement, and draft cleanup.

This phase completes resource administration for the fictional hosted
development environment. Implementation and hosted verification completed on
2026-08-14. It does not introduce quiz administration, resource completion
tracking, real clinical material, or real learner information.

## Starting point

- Milestone 4 Phases 1 through 3 are merged and deployed.
- Resource metadata, immutable versions, audiences, taxonomy, relations,
  entitlements, audit triggers, private Storage, signed PDF access, and the
  learner/instructor resource experience already exist.
- `publish_resource_version` already performs an atomic, administrator-checked
  publication transition.
- The private `course-resources` bucket permits exact-path, draft-only PDF
  inserts with no overwrite permission.
- The authenticated administrator route tree currently exposes People and
  Cohorts only; the `/demo/admin/resources` screen remains fictional and must
  not be modified.

## Scope

### Included

- Authenticated administrator Resources navigation and routes
- RLS-scoped resource list, search, and filters
- Resource metadata and audience/topic/teaching-stage editing
- Immutable version history and draft version creation
- Guide, checklist, YouTube identifier, and PDF version forms
- Exact-path PDF upload with `upsert: false`
- Explicit draft upload rollback and orphan-recovery handling
- Review submission, review recording, approval, publication, and retirement
- Administrator preview through the existing protected viewer boundary
- Recent, resource-scoped audit feedback
- Database/RLS, repository, component, and deployed browser verification

### Excluded

- Changes to `/demo` routes or fictional prototype repositories
- Real clinical documents or real user information
- Quiz, result, analytics, certificate, or export implementation
- Resource completion, progress, sequencing, or LMS-style gating
- Public Storage, permanent file URLs, or service-role credentials in the
  browser
- Destructive deletion of published resources, versions, or files
- Automated clinical-review reminders or scheduled orphan deletion
- Bulk resource operations

## Required backend hardening

Create a new migration with the Supabase CLI. Keep explicit grants and RLS on
every browser-accessible object because new public tables are no longer assumed
to be exposed automatically.

Keep database transactions short and free of network/Storage calls. Lifecycle
functions must lock rows in one documented order (parent resource before
version), use constraints for invariants, and avoid generic elevated helpers.
New RLS policies should cache identity lookups with `(select auth.uid())`, and
columns used in organization, state, cursor, or policy predicates must have
supporting indexes verified against the actual administrator queries.

### Lifecycle functions

Add narrowly scoped functions for transitions that must not trust browser-
supplied actor IDs or timestamps:

1. `create_resource_version_draft`
   - Locks the parent resource before allocating the next version number.
   - Verifies an active administrator in the resource organization.
   - Creates exactly one immutable draft snapshot.
   - For PDFs, generates and returns the version-specific private object path.
   - For non-PDF resources, validates the structured snapshot or YouTube
     identifier before insert.
2. `submit_resource_version_for_review`
   - Moves only a complete draft to `under_review`.
   - Rejects a PDF version unless the exact private object exists and satisfies
     the bucket MIME/size constraints.
3. `record_resource_version_review`
   - Sets `reviewed_by`, `reviewed_at`, and `next_review_at` from the acting
     administrator and validated input.
4. `approve_resource_version`
   - Sets `approved_by` and `approved_at` from the acting administrator.
   - Requires recorded review evidence and a future review date when the
     publication checklist requires one.
5. Harden the existing `publish_resource_version`
   - Retain the atomic current-version pointer update.
   - Require audience and topic assignments.
   - Require a teaching stage for instructor-audience resources.
   - Recheck the PDF object's exact path and metadata before publication.
6. `retire_resource`
   - Retires the stable resource without deleting historical versions or
     Storage objects.
7. `discard_resource_version_draft`
   - Removes only an unreferenced `draft` version after the Storage object has
     been removed or confirmed absent.
   - Never accepts approved, published, retired, archived, or current versions.

Prefer `security invoker`. If a function genuinely needs elevated access to
read Storage metadata or perform constrained cleanup, use the smallest
possible trusted function, an empty `search_path`, explicit active-admin and
organization checks, and explicit `REVOKE`/`GRANT`; cover every path with
pgTAP. Do not add a generic status-transition function.

### Column privileges and state integrity

- Remove direct authenticated updates to lifecycle actor/timestamp fields that
  are owned by the server transition functions.
- Keep administrators able to edit only draft metadata and content fields that
  are intentionally mutable.
- Preserve the existing trigger that prevents approved or historical version
  mutation and deletion.
- Keep resource type, organization, and course immutable once a version exists.
- Keep publication and retirement audit events append-only.

### Private PDF upload and rollback

The database and Storage service cannot share one transaction. Use a visible,
recoverable sequence:

1. Create the PDF draft version and receive its unique object path.
2. Upload through the Storage API with `contentType: application/pdf`, a
   conservative client size check, and `upsert: false`.
3. Confirm the object through the server-side review-readiness check before the
   draft can leave `draft`.
4. If upload fails, attempt Storage `remove` for the exact path and then discard
   the draft version.
5. If cleanup is interrupted, retain the visible draft with a `File needs
   attention` state and a retryable **Discard draft** action. Never silently
   hide it.

Add an exact-path Storage `DELETE` policy only for active same-organization
administrators and only while the matching version is still `draft`. Object
deletion must use the Storage API, never direct SQL against `storage.objects`.
Do not grant update/upsert or broad list access.

An orphan-recovery query may report stale draft PDF versions and object
presence to administrators, but automatic deletion remains deferred. A unique
path plus visible retryable cleanup makes failures safe without risking
historical content.

## Frontend architecture

Keep administrator resource code in the dedicated
`src/features/resource-admin/` feature and preserve the existing
learner/instructor read repository in `src/features/resources/`. The separate
feature owns administrator-specific models, repository functions, form schemas,
and TanStack Query hooks.

### Routes

- `/app/admin/resources` — list and filters
- `/app/admin/resources/new` — create resource and first draft
- `/app/admin/resources/:resourceId` — metadata, classifications, current
  state, version history, and audit feedback
- `/app/admin/resources/:resourceId/versions/new` — create immutable draft
- `/app/admin/resources/:resourceId/versions/:versionId` — draft/review detail,
  preview, and permitted lifecycle actions

Use full pages rather than small dialogs for editing. Preserve route-focus
management and back navigation. Add Resources to authenticated administrator
navigation without changing the `/demo/admin` shell.

### Repository and query boundaries

Add focused interfaces for:

- Listing administrator-visible resources and taxonomy
- Loading one resource with all versions and classifications
- Creating/updating stable metadata and classifications
- Creating and discarding draft versions
- Uploading/removing one exact PDF object
- Submitting, reviewing, approving, publishing, and retiring
- Loading recent resource-scoped audit events

Repository functions return stable application error codes. Raw Postgres,
Storage, or Supabase messages must not be shown in the interface. Mutations
invalidate only the resource list/detail keys they affect. Use bounded,
cursor-based pagination ordered by a stable `(updated_at, id)` or `(title, id)`
pair instead of loading an unbounded catalogue or using deep offsets.

### Forms

Use React Hook Form and Zod with visible labels and inline errors.

- Stable metadata: title, slug, type, estimated minutes, featured state,
  availability window, audience, topics, and teaching stages
- Version metadata: title, summary, guideline source/year, next review date
- Type-specific content:
  - Guide: ordered heading/body sections
  - Checklist: ordered item list
  - Video: YouTube identifier only
  - PDF: one `.pdf` file, maximum 20 MiB, no replacement/upsert

Resource type becomes read-only after a version exists. Audience and taxonomy
changes remain explicit and audited. Do not autosave lifecycle transitions.

## Administrator experience

### Resource list

- Desktop table with responsive cards below the table breakpoint
- Search plus audience, topic, teaching stage, type, resource status, and review
  status filters
- Status badges always include readable text and an icon where helpful
- Columns prioritize title, type, audience, current version, lifecycle state,
  review due state, and last update
- One clear **Add resource** primary action
- URL-preserved filters and useful loading, empty, offline, and retry states

### Resource detail and version history

- Clear separation between stable metadata and immutable version content
- Current published version identified with text, not colour alone
- Version history ordered newest first with creator, review, approval, and state
- Draft editing available only while the server permits it
- Preview launches the existing viewer logic without exposing a Storage URL
- Audit feedback states what changed, who acted, and when, without displaying
  secrets or unsafe metadata

### Publication checklist

Before enabling review/approval/publication actions, show explicit checks for:

- Complete content locator or structured content
- At least one audience and topic
- Teaching stage for instructor resources
- Guideline source and year
- Recorded reviewer and review date
- Future next-review date where required
- Verified private PDF object for PDF versions

Disabled actions must explain the missing requirement. Submission buttons show
pending state and prevent duplicate requests. Successful actions use a polite
live-region confirmation; errors identify a recovery step.

### Retirement and cleanup

- Place retirement and discard actions away from primary editing actions.
- Require confirmation that names the resource/version and explains the
  consequence.
- Retirement is reversible only through a separately implemented future
  policy; do not imply deletion.
- Draft discard is available only when server rules allow it and must report
  partial cleanup failures.

## Accessibility and responsive requirements

- WCAG 2.2 AA target
- Logical `h1`/`h2` hierarchy and route focus on every full page
- Fully keyboard-operable filters, form controls, version history, and actions
- Persistent labels, error summaries with links, and focus on the first invalid
  field after submission
- Approximately 44 by 44 pixel touch targets with at least 8 pixels between
  adjacent controls
- Status is never conveyed by colour alone
- Desktop information density without horizontal page overflow
- Mobile cards prioritize title, state, review due date, and primary action;
  secondary metadata may use progressive disclosure
- No hover-only controls, decorative motion, excessive gradients,
  glassmorphism, or layout-shifting interaction effects
- Unsaved form navigation and dismissal require confirmation

## Test plan

### Database and Storage

- Anonymous, learner, and instructor administrative writes fail.
- Cross-organization administrator reads/writes and object paths fail.
- Version numbers remain unique under concurrent draft creation.
- Lifecycle transitions reject missing or invalid prerequisites.
- Browser-supplied reviewer/approver IDs and timestamps cannot be forged.
- Publication remains atomic and accepts only an approved version belonging to
  the resource.
- PDF review/publication fails when the exact object is absent or invalid.
- Draft-only exact-path upload and delete pass; overwrite, broad listing, and
  published-object deletion fail.
- Draft discard cannot remove current or historical versions.
- Every material lifecycle/classification action creates a safe audit event.
- Migration rebuild, linked pgTAP, generated types, and security/performance
  advisors pass.

### Frontend

- Repository assembly and safe error mapping
- URL-preserved list filters and accessible empty state
- Zod validation for each resource type
- Pending/disabled publication checklist behavior
- PDF upload success, failure, rollback, and retryable partial-cleanup states
- Draft immutability and version-history rendering
- Successful review, approval, publication, retirement, and cache invalidation
- No signed URL, service key, raw backend error, or protected file bytes enter
  query cache, local storage, or rendered markup

### Browser verification

- Administrator list/create/edit/version/review/publish/retire flows at 375 by
  812, tablet landscape, and 1440 by 900
- Keyboard-only completion of the primary workflow
- 200 percent zoom/reflow and reduced-motion checks
- Learner and instructor views reflect publication/retirement correctly
- Direct private object access still fails
- Protected PDF preview uses the existing signed in-memory viewer
- Sign-out and role denial remain correct
- Browser console contains no unexpected warnings or errors

## Delivery sequence

1. Add the workflow-hardening migration and pgTAP coverage.
2. Apply it to the hosted fictional development project, regenerate types, and
   run advisors.
3. Add administrator models, repository functions, query/mutation hooks, and
   tests.
4. Add authenticated administrator navigation, list, filters, and detail/version
   routes.
5. Add resource/version forms and the exact-path PDF upload/rollback flow.
6. Add review, approval, publication, retirement, preview, and audit feedback.
7. Run the full frontend, database, Storage, function, accessibility, and
   deployed browser verification matrix.
8. Update continuity documentation and publish through a scoped pull request.

## Exit criteria

- An authorized administrator can create and classify a resource, add an
  immutable version, upload a fictional private PDF where applicable, complete
  review and approval, publish it, preview it, and retire it.
- A failed PDF upload leaves no hidden or publicly reachable content and has a
  clear retryable cleanup path.
- Published and historical versions and objects cannot be overwritten or
  deleted by normal browser actions.
- Learners and instructors see only currently permitted published content.
- Material changes are auditable and audit metadata contains no secrets,
  signed URLs, tokens, or file bytes.
- Typecheck, lint, relevant tests, production build, linked pgTAP, advisors,
  and deployed browser checks pass with no critical findings.

## Implementation boundary

The product owner explicitly authorized Phase 4 implementation after reviewing
this plan. The implementation is complete on the feature branch; no real user
information or clinical material was introduced, and no hosted fixture resource
was created, retired, or deleted during browser verification.
