# Milestone 6 Phase 4: Audited CSV Exports Plan

## Status: COMPLETE

## Objective
Provide authorized administrators with operational and analytical CSV exports from cohort activity without exposing bulk unvetted data to the client, while strictly logging every data export action in the database audit log.

---

## 1. Approved Export Scope

Phase 6.4 supports exactly three exports:
1. **Cohort Roster**: Enrolled learners and their membership status for a selected cohort.
2. **Assessment Results**: Latest authoritative pre-test or post-test results for learners in a cohort.
3. **Pre/Post Comparison**: Combined assessment results pairing pre-test and post-test scores with learning gain.

### Explicitly Excluded (Out of Scope)
- Item analysis CSV exports
- Raw quiz answer/distractor selections
- Question bank dumps
- XLSX or PDF generation
- Audit log exports
- Organization-wide exports
- Scheduled / background recurring exports
- Phase 6.5 production hardening

---

## 2. Security & Authorization Architecture

- **Backend-owned projection**: Database RPCs execute with `SECURITY DEFINER SET search_path = ''`.
- **Role restrictions**: Execution revoked from `anon` and `public`; granted only to `authenticated` and `service_role`.
- **Authorization validation**:
  - `auth.uid()` must be authenticated (`AUTH_REQUIRED`, 42501).
  - Target cohort must exist (`COHORT_NOT_FOUND`, P0001).
  - Actor must be an administrator in the cohort's owning organization via `private.is_admin_in_organization(target_cohort.organization_id)` (`ACCESS_DENIED`, 42501).
  - Instructors (both assigned and unassigned), learners, and cross-organization administrators are strictly denied.
- **Answer leakage prevention**: RPC payloads never query, reconstruct, or return question answers, selected option IDs, correct options, or explanations.
- **Learner Email contract**: `public.profiles` does not contain email and no existing admin application path exposes `auth.users.email`. `learnerEmail` is completely excluded from all RPC projections and CSV schemas.

---

## 3. Database Audit Requirement

Every invocation of an export RPC records an event in `public.audit_events`:
- **Actor**: `auth.uid()`
- **Organization**: `target_cohort.organization_id`
- **Entity**: `cohort` with ID `target_cohort.id`
- **Actions**:
  - `cohort.roster_exported`
  - `cohort.assessment_results_exported`
  - `cohort.pre_post_comparison_exported`
- **Metadata**:
  - `export_type`: string (`roster`, `assessment_results`, `pre_post_comparison`)
  - `assessment_type`: string (`pre_test` or `post_test`, where relevant)
  - `row_count`: integer (coalesced array length)
  - `request_id`: UUID
- **Privacy boundary**: Audit metadata strictly excludes learner names, scores, answers, and raw CSV text.

---

## 4. Authoritative Attempt & Scoring Semantics

- **Authoritative selection**: Only attempts with `status = 'submitted'` are evaluated.
- **Latest attempt**: `DISTINCT ON (learner_id)` ordered by `submitted_at DESC`.
- **Deterministic tie-breaking**: Orders deterministically by `qa.learner_id, qa.submitted_at DESC, qa.id DESC`.
- **Null semantics**: In-progress, timed-out, abandoned, or unattempted tests yield `status = 'not_submitted'` with `null` for scores and timestamps.
- **Learning gain**: `post_test_score - pre_test_score` in percentage points. Unpaired tests yield `null` (never fabricated zero).

---

## 5. CSV Safety, Serialization, and Filenames

- **Formula injection defense**: Text values starting with `=`, `+`, `-`, or `@` (even after leading whitespace or control characters like `\t`, `\r`, `\n`) are neutralized by prefixing with `'`.
- **Numeric preservation**: Pure numeric values (e.g. `-12.5`) remain unchanged numbers and are never prefixed with `'`.
- **RFC-4180 compliance**: Double quotes escaped as `""`, fields containing quotes, commas, or newlines are wrapped in quotes. Row endings are CRLF (`\r\n`).
- **Zero-row handling**: A cohort with zero learners outputs headers with CRLF and no data rows.
- **Filename sanitization**: Cohort codes and export types are stripped of directory traversal sequences (`..`), path separators (`/`, `\`), and control characters.
- **Deterministic naming**:
  - `bls_<cohort-code>_roster_<yyyy-mm-dd>.csv`
  - `bls_<cohort-code>_pre-test-results_<yyyy-mm-dd>.csv`
  - `bls_<cohort-code>_post-test-results_<yyyy-mm-dd>.csv`
  - `bls_<cohort-code>_pre-post-comparison_<yyyy-mm-dd>.csv`
- **Ephemeral handling**: Memory Blob -> temporary object URL -> programmatic link trigger -> immediate URL revocation. No storage in `localStorage`, `IndexedDB`, or service worker caches.

---

## 6. Exact CSV Column Specifications

### Cohort Roster (4 columns)
1. `Cohort Code`
2. `Cohort Name`
3. `Learner Name`
4. `Membership Status`

### Assessment Results (10 columns)
1. `Cohort Code`
2. `Cohort Name`
3. `Learner Name`
4. `Assessment Type`
5. `Quiz Title`
6. `Quiz Version Number`
7. `Status`
8. `Submitted At`
9. `Score Percent`
10. `Passed`

### Pre/Post Comparison (11 columns)
1. `Cohort Code`
2. `Cohort Name`
3. `Learner Name`
4. `Pre-Test Status`
5. `Pre-Test Submitted At`
6. `Pre-Test Score Percent`
7. `Post-Test Status`
8. `Post-Test Submitted At`
9. `Post-Test Score Percent`
10. `Post-Test Passed`
11. `Learning Gain (Percentage Points)`

---

## 7. Verification Summary

- **Forward-only corrective migration**: `20260819133000_milestone_6_csv_exports_corrections.sql` applied to linked Supabase. Local and remote migration counts aligned at 27 migrations.
- **Authoritative Database Types**: Regenerated cleanly via `npx supabase gen types typescript --linked`.
- **pgTAP Isolated Suite**: `supabase/tests/database/exports.test.sql` passed all 36 assertions.
- **pgTAP Linked Suite**: Ran all 12 test files, 328/328 assertions PASS.
- **Database Lint**: `npx supabase db lint --linked` reported 0 schema errors.
- **TypeScript Typecheck**: `npm run typecheck` passed (exit code 0).
- **ESLint**: `npm run lint` passed (exit code 0).
- **Vitest Suite**: 26 test files passed, 112/112 tests passed (including 18 serializer tests, 12 export-repository tests, and 8 export-page tests).
- **Production Build**: `npm run build` passed cleanly with code 0.
- **Diff Check**: `git diff --check` passed cleanly.
- **Rendered Browser Verification (Chrome DevTools MCP)**:
  - Mobile (320×800), tablet (768×1024), and desktop (1440×900) responsive layouts verified with zero horizontal overflow.
  - Cohort selector, privacy notice, stacked cards, and >=44×44px touch targets verified.
  - Results navigation, keyboard focus rings, and ARIA attributes (`role="status"`, `role="alert"`) verified.
  - Actual CSV downloads triggered and inspected: Cohort Roster (4 columns, no email), Pre-Test Results (10 columns, unsubmitted learners non-fabricated), Post-Test Results (10 columns), and Pre/Post Comparison (11 columns, null learning gains for unpaired learners).
  - Network RPC payloads inspected: zero private or sensitive fields returned (no emails, answers, option IDs, answer keys, or explanations).
  - Browser console inspected: zero React warnings, zero unhandled runtime errors, and zero failed RPC calls.
- **Security & Performance Advisor**: Static security/performance review completed; formal advisor execution deferred to Phase 6.5.
