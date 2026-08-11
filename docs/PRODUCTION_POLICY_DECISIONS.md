# Production Policy Decisions

These decisions unblock the first production schema and authorization work.
They use conservative defaults appropriate for a healthcare learning companion
and can be revised through a later architecture decision.

## Quiz review

- Learners may see their score, pass/fail status, and topic-level summary after
  submission when the quiz policy permits.
- The MVP does not expose selected answers, correct answers, or question-level
  explanations to learners.
- Instructors see assigned learners' completion status and permitted results,
  never learner answers or answer keys.
- Detailed answer review remains available only to explicitly authorized quiz
  administrators through trusted server-side operations added in Milestone 5.

## Cohort memberships

- A learner may have only one active cohort membership at a time.
- Historical completed memberships are retained.
- Instructors may be assigned to multiple active cohorts.

## Post-test release

- An assigned instructor may release the post-test for their assigned cohort.
- An administrator may release it within their organization.
- Release is server-enforced, idempotent, and creates an append-only audit
  event containing the actor, cohort, timestamp, and request identifier.
- A release cannot be reversed after an attempt has started. Exceptional
  administrative correction requires a separately audited trusted operation.

## Exports

- Roster, results, and pre-/post-test comparison CSV exports are
  administrator-only in the MVP.
- Export authorization is organization-scoped and enforced by a trusted server
  operation, not by frontend route visibility.
- Every export records an audit event with actor, organization, report type,
  filters, row count, and timestamp. Export contents must not be stored in the
  audit metadata.
