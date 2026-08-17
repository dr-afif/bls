# Milestone 5 Phase 2 — Administrator Quiz Authoring

## Objective

Provide administrators with a secure, accessible production workspace for
creating fictional question content, composing pre-tests and post-tests,
publishing immutable versions, and releasing a current post-test to a physical
course cohort. The learner attempt journey remains Phase 5.3.

## Implemented scope

- Live administrator quiz library and searchable question bank.
- Full-page question and quiz editors using React Hook Form and Zod.
- Single-best-answer and true/false question authoring.
- Active BLS-topic assignment and one administrator-only correctness key.
- Ordered composition from current published question versions.
- Passing score, time limit, attempt limit, option randomization, optional
  availability window, and fixed safe learner-review policy.
- New immutable versions branched from current published content.
- Current published post-test release to a course-matched cohort.
- Loading, empty, recoverable error, validation, and pending states.

## Security boundary

- Browser roles have read-only grants on quiz authoring tables.
- Eight fixed-search-path `security definer` RPCs own compound draft creation,
  replacement, version branching, and publication.
- Each RPC requires an active administrator in the target organization.
- Cross-course question composition and inactive/cross-organization topics are
  rejected by the database.
- Published question and quiz versions and their child rows remain immutable.
- Each stable question or quiz can have only one editable draft at a time.
- Correctness flags are readable only through administrator-scoped RLS and are
  never included in learner attempt payloads.
- Every material authoring transition and release creates an append-only audit
  event. Existing release is idempotent and rate limited.

## Deliberately deferred

- Authenticated learner availability, attempt, autosave, submission, timer,
  recovery, and personal result screens.
- Instructor-facing post-test release controls.
- Question retirement, quiz retirement, clone/import, bulk editing, media,
  multiple-response, remediation, certificates, and item analysis.
- Real clinical assessment content or clinical-governance approval.

## Verification

- Hosted migration application and generated TypeScript database types.
- 231 passing pgTAP assertions across eight suites, including 29 Phase 5.2
  authoring assertions.
- Strict typecheck and lint.
- 54 passing Vitest tests across 20 files.
- Passing production build with route-split authoring pages.
- Rendered administrator checks at 320 by 800 and 1440 by 900 with no page
  overflow or console errors, readable labels/statuses, approximately 44-pixel
  controls, route focus, and first-invalid-field focus.
- Security and performance advisor review; no unindexed foreign keys remain.

## Exit criteria

- Only permitted administrators can create, edit, version, or publish quiz
  content for their organization.
- Compound authoring changes are atomic and audit recorded.
- Published assessment history cannot be rewritten.
- Administrators can discover and release a current published post-test to a
  matching cohort without exposing answer keys to learners or instructors.
