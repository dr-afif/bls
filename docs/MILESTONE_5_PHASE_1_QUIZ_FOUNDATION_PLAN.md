# Milestone 5 Phase 1 — Secure Quiz Foundation

## Objective

Establish the production data and authorization boundary for one pre-test and
one post-test without yet building the complete authoring or learner journey.
All hosted fixtures remain fictional and non-clinical.

## Scope

- Stable quiz and question identities with immutable published versions.
- Single-best-answer and true/false questions using one single-selection flow.
- Controlled attempt start with frozen question and option snapshots.
- Server-owned timing, attempt limits, post-test release, autosave, submission,
  scoring, and audit events.
- Learner-safe payloads that never include answer keys or per-answer scoring.
- Approved learner result policy: score, pass state, and topic summary only.
- Typed frontend repository interfaces for the next learner-UI phase.

## Product boundary

Quiz eligibility depends on an active account, effective course entitlement,
active learner cohort, publication/window state, attempt limit, and—for a
post-test—manual release by an assigned instructor or administrator. Resource
viewing or “completion” is not a prerequisite because this product is a
physical-course companion, not a self-paced LMS.

## Security decisions

- Correctness flags and per-answer score records are never exposed to learner
  queries. Detailed scoring records live in the unexposed `private` schema.
- State-changing operations use fixed-search-path `security definer`
  functions with explicit user, role, organization, cohort, and lifecycle
  checks.
- Browser roles cannot directly insert or update attempts, answers, releases,
  or scores.
- Published question versions, options, topic assignments, and quiz-version
  composition are immutable.
- Submission is idempotent for one client request UUID and locks the attempt
  before scoring.
- Rate limits are enforced server-side for start, autosave, submit, and release
  operations.
- Releases, attempt starts, and submissions create audit events.

## Deferred to later Milestone 5 phases

- Administrator question-bank and quiz-authoring screens.
- Learner instructions, question flow, offline messaging, and submission UI.
- Administrator/instructor results interfaces and exports.
- Multiple-response, image, ordering, practice, remediation, certificates, and
  question-level learner review.
- Real clinical assessment content and clinical-governance approval.

## Verification

1. Apply migrations to the linked fictional Supabase project.
2. Run all pgTAP suites, including anonymous denial, organization isolation,
   release authority, key non-disclosure, frozen versions, autosave ownership,
   idempotent scoring, attempt limits, immutability, and auditing.
3. Regenerate TypeScript database types.
4. Run typecheck, lint, focused Vitest tests, and the production build.
5. Run Supabase security and performance advisors and record any accepted
   informational findings.

## Exit criteria

- Learners cannot retrieve correct answers through table reads or RPC payloads.
- Learners cannot write final scores or mutate submitted answers.
- A started attempt remains tied to its exact quiz/question/option versions.
- Post-test release and all attempt constraints are enforced by the database.
- Repeated submission with the same request UUID returns the original result.
- Historical attempts remain interpretable after later authoring changes.
