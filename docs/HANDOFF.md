# Development Handoff

## Last updated

2026-09-24

## Current milestone

- Milestone 6 (Phases 6.1, 6.2, 6.3, 6.4, 6.5) — COMPLETE & FORMALLY CLOSED (TECHNICAL PRODUCTION READINESS: PASS; FINAL CLEAN-SLATE RESET: REQUIRED BEFORE REAL PARTICIPANT LAUNCH).
- Milestone 7 (Controlled Onboarding, Multi-Course Cohorts & Bilingual Foundation) — ACTIVE:
  - Architecture & Documentation Phase — COMPLETE & REFINED.
  - Phase 7.1: Schema & Compatibility Foundation:
    * Phase 7.1A: Local/CI Database Schema Foundation — PASS.
    * Phase 7.1A.1: Local Schema Hardening & Correction Pass — PASS.
    * Phase 7.1B: Controlled Hosted Schema Deployment & Verification — PASS.
    * Phase 7.1 — COMPLETE.
    * Deployed hosted migration versions: `20260922010000_milestone_7_enums.sql`, `20260922020000_milestone_7_schema_foundation.sql`.
  - Phase 7.2: Bilingual Application Foundation:
    * Phase 7.2A: Bilingual Locale & Preference Foundation (Local/CI Foundation Only) — COMPLETE (PASS).
    * Phase 7.2A.1: i18n Foundation Correction Pass (Local/CI Only) — COMPLETE (PASS).
    * Phase 7.2 overall status: NOT COMPLETE.
    * Phase 7.2B: Assessment & Content Localization + Hosted Deployment — PLANNED (NOT STARTED).
  - Phase 7.3: Email Transport Spike & Staff Bootstrap — PLANNED.
  - Phase 7.4: Cohort Roster & Invitation Engine — PLANNED.
  - Phase 7.5: Passwordless Return Spike, First-Time & Returning User Registration — PLANNED.
  - Phase 7.6: Multi-Course Access + Close/Restore — PLANNED.
  - Phase 7.7: E2E Production Verification — PLANNED.
  - Final Release Gate: Controlled Production Clean-Slate Reset — REQUIRED immediately prior to first real participant launch.

## Work completed

- Implemented Milestone 7 Phase 7.2A: Bilingual Locale & Preference Foundation (Local/CI Implementation Only) — COMPLETE (PASS):
  - Lightweight First-Party i18n Framework:
    * Created typed client-side localization framework under `src/lib/i18n/` (`types.ts`, `en.ts`, `ms.ts`, `i18n-context.tsx`, `use-translation.ts`, `localized-text.ts`, `formatting.ts`).
    * Strongly typed dictionaries with full compile-time key parity between English (`en`) and Bahasa Melayu (`ms`).
    * English is canonical default and automatic fallback; date/time and number formatters mapped cleanly to `en-MY` and `ms-MY`.
    * Synchronizes document language (`<html lang="en">` / `<html lang="ms">`) automatically on locale switch.
  - Pre-Auth & Post-Auth Language Preference Precedence:
    * Pre-auth: Persisted in non-sensitive `bls.locale` in `localStorage`. Defaults strictly to English (`'en'`). Does NOT auto-switch based on `navigator.language`.
    * Post-auth: Authoritative user preference loaded from `profiles.preferred_language`. Updating locale when signed in immediately syncs UI, updates `localStorage`, and updates `profiles.preferred_language`.
    * Fail-safe error handling: Persistence failures revert safely with user feedback without blocking the session or logging the user out.
  - Accessible Language Switcher Component:
    * Created `LanguageSwitcher` (`src/components/common/language-switcher.tsx`) supporting keyboard navigation, WAI-ARIA radiogroup semantics, screen-reader labels, and visible active state.
    * Uses official labels "English" and "Bahasa Melayu" (never "Malay").
    * Integrated into login/auth layout, learner field shell, instructor field shell, and operations/admin navigation bar.
  - System Core UI Translation:
    * Translated core system flows: Login, Forgot Password, Reset Password, Auth Callback, Access State, Not Found, Route Error, State Panel, navigation labels, and sign-out UI.
    * Untranslated clinical/assessment content is strictly preserved as English source until Phase 7.2B.
  - Safe Authored Bilingual Helper:
    * Created `localizedText({ en, ms, locale })`: returns Bahasa Melayu text if `locale === 'ms'` and non-empty/non-whitespace BM text is authored; otherwise falls back safely to English.
  - Additive Database Migration (`20260924010000_milestone_7_bilingual_foundation.sql`):
    * `public.profiles.preferred_language`: `text NOT NULL DEFAULT 'en'`, check constraint `preferred_language IN ('en', 'ms')`.
    * Profile self-update column grant: Granted `UPDATE (preferred_language)` to `authenticated` role on `public.profiles`. The existing consolidated RLS policy `profiles_update_authorized` permits users to update their own active profile or administrators to update profiles within their organization.
    * `public.courses.title_ms`: check constraint between 2 and 160 characters (matching English `title`).
    * `public.courses.description_ms`: nullable text without length checks (matching English `description`).
    * `public.cohorts.name_ms`: check constraint between 2 and 160 characters (matching English `name`).
    * `public.cohorts.description_ms`: nullable text without length checks (matching English `description`).
    * `public.resource_language` enum: `'en'`, `'ms'`, `'bilingual'`, `'language_independent'`.
    * `public.resources.content_language`: `resource_language NOT NULL DEFAULT 'en'`.
  - Production Backward-Compatibility Adapter:
    * Hosted Supabase database remains on Phase 7.1 schema (no hosted migrations deployed yet).
    * `account-access-repository.ts` catches PostgREST error `42703` (missing column `preferred_language`) and falls back immediately to selecting standard profile columns without crashing.
    * `updatePreferredLanguage` catches error `42703` gracefully, allowing local preference to function without database errors on hosted environments.
  - Automated Testing & Verification:
    * Added pgTAP test suite `supabase/tests/milestone_7_bilingual_foundation_test.sql` with 21 assertions covering column definitions, defaults, constraints, active self-update, suspended update denial, and foreign update denial.
    * Total pgTAP suites: **15 test suites, 461 total assertions — 100% PASS**.
    * Frontend test suite: **39 test files, 224 total tests — 100% PASS** (added `i18n-context.test.tsx`, `localized-text.test.ts`, `language-switcher.test.tsx`, `account-access-repository.test.ts`).
    * Typecheck (`npm run typecheck`): 0 errors.
    * Lint (`npm run lint`): 0 errors, 0 warnings.
    * Build (`npm run build`): PASS (exit code 0).
  - Strict Operational Boundaries:
    * `HOSTED_SUPABASE_MUTATIONS = ZERO`
    * `PHASE_7_2_HOSTED_MIGRATION_DEPLOYED = NO`
    * `PHASE_7_2B_STARTED = NO`

- Implemented Milestone 7 Phase 7.2A.1: i18n Foundation Correction Pass (Local/CI Implementation Only) — COMPLETE (PASS):
  - Authoritative Post-Auth Preference Resolution:
    * Corrected preference precedence so authenticated profile preference (`profile.preferredLanguage`) is authoritative when available. Pre-auth manual/local selections made in `localStorage` no longer outrank an authenticated user's persisted profile preference.
    * On sign-out, the last safe locale is preserved in `localStorage`.
    * Added regression tests verifying pre-auth `ms` -> sign-in `en` => `en`, and pre-auth `en` -> sign-in `ms` => `ms`.
  - Explicit Preference Availability Modeling:
    * Extended `AccountAccess['profile']` with typed `preferredLanguageAvailable: boolean`.
    * Phase 7.2 local schema: `preferredLanguageAvailable = true`.
    * Hosted Phase 7.1 fallback (PostgREST error 42703): `preferredLanguageAvailable = false`.
    * Accurately distinguishes an explicit user choice of English from the temporary absence of the database column on unmigrated hosted instances.
  - Optimistic Persistence & Reversion Semantics:
    * Signed-in preference update changes UI immediately, sets optimistic state, and initiates persistence.
    * The temporary optimistic state clears automatically as soon as the refetched `profile.preferredLanguage` matches the requested locale.
    * If persistence fails, the UI reverts to the persisted profile preference, restores `localStorage` to that value, and exposes a localized error without signing out.
    * If `preferredLanguageAvailable === false` (hosted 7.1 schema), the update remains safely local without pretending database persistence occurred and without displaying false persistence errors.
  - Localized User-Facing Preference Error:
    * Replaced raw English string ("Failed to update preference") with translation key `profile.languageUpdateFailed` ("Failed to save language preference. Please try again." / "Gagal menyimpan pilihan bahasa. Sila cuba lagi.").
    * Rendered visibly in `LanguageSwitcher` with `role="alert"` and `aria-live="polite"` for screen readers.
  - System Core Shell UI Translation Completed:
    * Replaced all hard-coded English in core shells: `AuthLayout` (introductory heading, description, security badge, demo button, footer text), `OperationsShell` (live data badge, aria labels), `FieldShell` (skip link, companion label, aria labels), `DemoBanner` (badge, subtitle, role switcher button, aria labels), and `AppLogo` (prototype badge).
    * Maintained 100% EN/MS dictionary key parity. Clinical/assessment prototype content remains in English until Phase 7.2B.
  - Accessible Language Switcher (Option B Pattern):
    * Standardized on accessible `role="group"` with native buttons using `aria-pressed`, official translated labels ("English", "Bahasa Melayu"), and localized error message. Native button semantics guarantee universal keyboard navigation (Tab / Enter / Space).
  - Schema & Policy Documentation Alignment:
    * Verified actual SQL constraints: `courses.title_ms` (2–160 chars), `cohorts.name_ms` (2–160 chars), with unconstrained nullable text for descriptions (matching existing English schema). Corrected prior documentation claims of 1–255 / max 5000.
    * Corrected references to the profile update policy to cite `profiles_update_authorized` (consolidated policy).
  - Profile Update Authorization Regression & Decision Checkpoint:
    * Reconfirmed pgTAP tests: active users can update own `preferred_language`; learners cannot update other learners; suspended accounts cannot update; protected fields (`account_status`, `organization_id`, `role`) cannot be modified.
    * Product/Security Decision Checkpoint: Documented that existing consolidated policy `profiles_update_authorized` permits administrators in the same organization to update other users' profile records, including `preferred_language`. The preferred product behavior is self-owned language preference. If strict self-ownership is required in a future phase, a dedicated trigger or RPC design should be formally reviewed.
  - Project-Local Supabase Ports:
    * Local ports (`53321` API, `53322` DB, `53320` shadow, `53329` pooler, `53323` studio, `53324` inbucket) documented as intentional project-local development ports to avoid Windows host port conflicts.
  - Automated Testing & Verification:
    * pgTAP suite: **15 test suites, 461 total assertions — 100% PASS**.
    * Frontend test suite: **39 test files, 224 total tests — 100% PASS** (added regression tests in `i18n-context.test.tsx` and `language-switcher.test.tsx`).
    * Typecheck (`npm run typecheck`): 0 errors.
    * Lint (`npm run lint`): 0 errors, 0 warnings.
    * Build (`npm run build`): PASS (exit code 0).
  - Strict Operational Boundaries:
    * `HOSTED_SUPABASE_MUTATIONS = ZERO`
    * `PHASE_7_2_HOSTED_MIGRATION_DEPLOYED = NO`
    * `PHASE_7_2B_STARTED = NO`

- Implemented Milestone 7 Phase 7.1B: Controlled Hosted Schema Deployment & Verification — COMPLETE (PASS):
  - Pre-Deployment Verification & Preflight:
    * Local Baseline: Verified git status clean, branch `main`, HEAD commit `1df0a69d3e9fc7aa9bb185b0cdf5a09b37a32a15`.
    * Linked Project: Verified linked Supabase project reference is strictly `zlaixhnyydxgbphgsetv`.
    * Remote Migration History: Preflight confirmed remote migration history ended cleanly at `20260820090000_milestone_6_user_provisioning_transaction`. Exactly two pending migrations (`20260922010000`, `20260922020000`), zero remote-only migrations, zero drift. Dry-run verified 2 migrations to be applied, 0 seeds, 0 custom roles.
    * Hosted Data Preflight: Read-only inventory confirmed 2 cohorts (`BLS-DEMO-01`, `KTGS02-0826`), 1 course (`1eda1f27-28b0-4ebd-ac5b-ee8bb132ca66`), 3 profiles, 0 cohort members, 0 course entitlements, 0 null course_ids, and 0 organization mismatches. Confirmed target tables did not exist prior to push.
  - Migration Deployment:
    * Deployed exactly the two reviewed migrations via `npx supabase db push`:
      1. `20260922010000_milestone_7_enums.sql`
      2. `20260922020000_milestone_7_schema_foundation.sql`
    * Exit code 0, clean execution, no repair or rollback flags used.
  - Post-Deployment Schema & Data Verification:
    * Hosted migration history contains all 30 migrations matching local 1-to-1, ending at `20260922020000`.
    * Enums: `account_status` contains `pending_registration`; `learner_access_state` has values `'open'` and `'closed'`.
    * Cohorts: `learner_access_state` column exists, `NOT NULL`, default `'open'`, both existing cohorts set to `'open'`; legacy `course_id` remains `NOT NULL`.
    * Backfill: `cohort_courses` contains exactly 2 rows matching existing cohorts (`BLS-DEMO-01`, `KTGS02-0826`) with `display_order = 0`, `start_at = NULL`, `end_at = NULL`, `venue = NULL`, and organization parity confirmed. Legacy sync trigger `trg_sync_cohort_legacy_course` active on `cohorts`.
    * Intent Tables: `cohort_learner_roster`, `staff_access_entries`, and `access_invitations` created with fail-closed RLS enabled and 0 initial rows.
    * Private Identity: `private.learner_identities` exists in `private` schema with 0 rows; grants revoked from all browser roles (`anon`, `authenticated`), accessible only to `postgres` service role.
    * Compatibility & Invariants: `one_active_cohort_per_learner` unique index intact; `private.handle_auth_user_confirmed()` retains Milestone 6 behavior; profile count intact (3).
  - Hosted Type Parity:
    * Generated TypeScript types from linked hosted project into temporary file.
    * Compared against `src/lib/supabase/database.types.ts`: verified byte-for-byte schema equivalence (differed only by standard CLI PostgREST 14.5 version annotation comment block). Temporary comparison file cleaned up.
  - Security & Performance Advisors:
    * Ran `supabase db advisors --linked --type security` and `--type performance`.
    * Verified **0 security issues** and **0 performance issues** attributable to Phase 7.1 objects.
  - Production App Smoke:
    * Production app entry and assets (`https://dr-afif.github.io/bls/`) verified over HTTP: status 200 OK.
    * Automated build and test suites pass 100% locally (33 files, 189 tests, typecheck 0 errors, lint 0 errors, build succeeds).
    * Authenticated live production user smoke reported as MANUAL_CONFIRMATION_REQUIRED per guidelines.
  - Documentation Cleanups:
    * Corrected MyKad validation description in canonical docs to remove undocumented "checksum" rule; specified date-format / DOB prefix and accepted state/place code validation where formally specified.
    * Recorded Phase 7.5 design checkpoint: evaluate whether passport uniqueness must include issuing-country context before enabling real participant registrations.
  - Strict Operational Boundaries:
    * `HOSTED_MILESTONE_7_MIGRATIONS = 20260922010000, 20260922020000`
    * `SEED_EXECUTED_ON_HOSTED = NO`
    * `AUTH_CONFIG_MUTATIONS = ZERO`
    * `EDGE_FUNCTION_DEPLOYS = ZERO`
    * `SMTP_MUTATIONS = ZERO`
    * `CLEAN_SLATE_RESET_EXECUTED = NO`

- Implemented Milestone 7 Phase 7.1A.1: Local Schema Hardening & Correction Pass — COMPLETE (PASS):
  - Hardened Local/CI Database Migrations (Pre-Hosted Direct Modification):
    * `cohort_courses` Dynamic Inheritance: Backfilled legacy relationships and compatibility trigger (`private.sync_cohort_legacy_course()`) populate NULL overrides for `start_at`, `end_at`, and `venue`, ensuring parent cohort values are dynamically inherited via `coalesce(...)` and updates are not shadowed. Documented retirement of compatibility trigger during Phase 7.6 multi-course write cutover.
    * Supersession Lineage Hardening: Hardened `private.validate_access_invitation()` to enforce that a new invitation attempt may supersede only a previous attempt for the same authorization intent target (same roster entry or same staff access entry). Rejected cross-target supersession even within the same organization.
    * Status Lifecycle Constraints & Historical Field Immutability: Added `invitation_status_lifecycle_check` on `public.access_invitations` ensuring `token_hash`, `sent_at`, and `expires_at` are required and immutable on all `sent`, `redeemed`, `expired`, and `superseded` rows. Changing status from `sent` cannot null historical send fields.
    * Exact 7-Day Product Validity: Enforced `CHECK (sent_at IS NULL OR expires_at IS NULL OR expires_at = sent_at + interval '7 days')` on `access_invitations`, locking exact 7-day validity from dispatch time.
    * Token Hash Format Enforcement: Added `CHECK (token_hash IS NULL OR token_hash ~ '^[0-9a-f]{64}$')`, guaranteeing lowercase 64-char hexadecimal SHA-256 hash representation.
    * Removed Generic Metadata: Removed unjustified `metadata jsonb` container from `access_invitations` and generated database types.
    * Preserved Invitation History on Target Deletion: Changed target FKs `cohort_roster_entry_id`, `staff_access_entry_id`, and `supersedes_invitation_id` from cascading delete to `ON DELETE RESTRICT`, preventing accidental destruction of historical attempt records.
    * Aligned National Identity Format & Documentation: Standardized Passport canonical shape to uppercase trimmed alphanumeric 6–20 characters (`^[A-Z0-9]{6,20}$`) and MyKad to 12 numeric digits (`^[0-9]{12}$`). Clarified in canonical docs that database validates shape only, while semantic validation (date-format / valid DOB prefix and accepted Malaysian place-of-birth code where formally specified) is deferred to the trusted Phase 7.5 registration layer; Phase 7.5 must not invent or implement an undocumented MyKad checksum rule. Recorded Phase 7.5 design checkpoint regarding passport issuing-country context.
  - Preserved Backward Compatibility & Sequencing Safeguards:
    * Safeguard A: Preserved existing `private.handle_auth_user_confirmed()` email confirmation behavior (transitions unconfirmed users to `'active'`, not `'pending_registration'`).
    * Safeguard B: Preserved `cohorts.course_id` (NOT NULL) and installed compatibility mirroring trigger.
    * Safeguard C: Preserved `one_active_cohort_per_learner` partial index until Phase 7.6 application multi-cohort cutover.
  - Automated Testing & Verification:
    * Updated pgTAP test suite `supabase/tests/milestone_7_schema_foundation_test.sql` to **82 assertions** covering all 10 hardening requirements.
    * Total pgTAP suites: **14 test suites, 440 total assertions — 100% PASS**.
    * Database schema lint (`supabase db lint --local --schema public`): 0 errors.
    * Migrations from zero + seed (`supabase db reset`): 30 migrations applied cleanly.
    * Generated TypeScript types: `src/lib/supabase/database.types.ts` regenerated from local database.
    * Frontend quality: typecheck (`tsc -b`), lint (`eslint .`), Vitest (33 files, 189 tests), and production build (`vite build`) all 100% PASS.
  - Hosted Protection:
    * Confirmed `HOSTED_SUPABASE_MUTATIONS = ZERO`. Zero remote database pushes, zero remote SQL executed, zero auth/SMTP updates, zero Edge Function deploys.

- Implemented Milestone 7 Phase 7.1A: Schema & Compatibility Foundation (Local/CI Implementation Only) — COMPLETE (PASS):
  - Created Local/CI Database Migrations:
    * `20260922010000_milestone_7_enums.sql`: Safely added `'pending_registration'` to `public.account_status` and created `public.learner_access_state` enum (`'open'`, `'closed'`). Separated into dedicated migration for PostgreSQL transaction safety.
    * `20260922020000_milestone_7_schema_foundation.sql`: Created `public.cohort_courses` join table with schedule overrides, backfilled from `cohorts.course_id`, added compatibility mirroring trigger `private.sync_cohort_legacy_course()`; created `public.cohort_learner_roster` with normalized email and org consistency; created `public.staff_access_entries` with durable uniqueness `(organization_id, email, intended_role)`; created `public.access_invitations` with exclusive target CHECK, 7-day validity from `sent_at`, active-attempt uniqueness, and dispatch field checks; created `private.learner_identities` in `private` schema with canonical MyKad/passport format validation and explicit privilege revocation from browser roles (`public`, `anon`, `authenticated`); added `cohorts.learner_access_state` NOT NULL default `'open'`; enabled fail-closed RLS on all new public tables.
  - Preserved Backward Compatibility & Sequencing Safeguards:
    * Safeguard A: Preserved existing `private.handle_auth_user_confirmed()` email confirmation behavior (transitions unconfirmed users to `'active'`, not `'pending_registration'`), keeping current invitation flow intact until Phase 7.5.
    * Safeguard B: Preserved `cohorts.course_id` (NOT NULL) and installed compatibility mirroring trigger so existing frontend course writes populate `cohort_courses`.
    * Safeguard C: Preserved `one_active_cohort_per_learner` partial index until Phase 7.6 application multi-cohort cutover.
  - Automated Testing & Verification:
    * Added comprehensive pgTAP test suite `supabase/tests/milestone_7_schema_foundation_test.sql` (52 assertions).
    * Total pgTAP suites: 14 files, 410 assertions — 100% PASS.
    * Database schema lint (`supabase db lint --local --schema public`): 0 errors.
    * Migrations from zero + seed (`supabase db reset`): 30 migrations applied cleanly.
    * Generated TypeScript types: `src/lib/supabase/database.types.ts` regenerated from local database.
    * Frontend typecheck (`tsc -b`), lint (`eslint .`), unit/component tests (Vitest: 33 files, 189 tests), and production build (`vite build`): 100% PASS.
  - Hosted Protection:
    * Confirmed `HOSTED_SUPABASE_MUTATIONS = ZERO`. Zero remote database pushes, zero remote SQL executed, zero auth/SMTP updates, zero Edge Function deploys.

- Implemented Milestone 7: Controlled Onboarding, Multi-Course Cohorts & Bilingual Foundation (Architecture & Documentation Phase) — COMPLETE & REFINED:
  - Produced canonical architecture specification: [`docs/MILESTONE_7_ONBOARDING_ARCHITECTURE_PLAN.md`](MILESTONE_7_ONBOARDING_ARCHITECTURE_PLAN.md).
  - Documented ADRs 017–022 in [`docs/DECISIONS.md`](DECISIONS.md):
    * `ADR-017`: Pre-Auth authorization intent, invitation-to-target integrity, and 7-day invitation lifecycle.
    * `ADR-018`: Multi-course cohort join model and optional per-course schedule overrides.
    * `ADR-019`: Reversible cohort learner-access gate (`learner_access_state`).
    * `ADR-020`: Bilingual (EN/MS) translation framework and authored content localization.
    * `ADR-021`: Private schema National Identity (I.C.) boundary, safe uniqueness, and role-based masking.
    * `ADR-022`: Existing-user enrollment timing, passwordless return flow, and email transport technical spike.
  - Incorporated 10 critical architecture review corrections:
    1. Added durable staff authorization intent (`public.staff_access_entries`) before Auth creation, adhering to strict hierarchy and separating intent from invitation attempts.
    2. Enforced invitation-to-target referential integrity in `public.access_invitations` (`cohort_roster_entry_id` vs `staff_access_entry_id` with exclusive CHECK).
    3. Corrected all proposed actor foreign keys to nullable `ON DELETE SET NULL`, preserving immutable provenance in `public.audit_events`.
    4. Moved full National Identity to `private.learner_identities` (denying direct browser SELECT) with server-derived masked projection (`******-**-1234`) and controlled RPCs.
    5. Defined MyKad (strictly 12 digits `^\d{12}$`) and passport normalization with safe duplicate failure preventing identity enumeration.
    6. Extended `cohort_courses` with optional schedule and venue overrides (`start_at`, `end_at`, `venue`) inheriting parent cohort values when null.
    7. Locked authoritative existing-user enrollment timing (staging = intent only; invitation dispatch immediately activates cohort membership and course entitlements).
    8. Designed one-time passwordless return flow for existing users via short-lived Supabase Auth token exchange, preserving existing passwords without forced entry.
    9. Documented Email Transport Spike as a required technical gate in Phase 7.3 before invitation implementation.
    10. Enforced dynamic server-derived effective expiry (`status = 'sent' AND expires_at <= now()`) independent of background cron jobs.
    11. Hardened token handling (high-entropy secrets, SHA-256 database hashes, immediate URL/history scrubbing, anti-scanner landing page).
  - Reconciled all 6 known current architecture conflicts with clear migration strategies.
  - Baseline preserved: zero code, migration, or hosted database mutations executed during this architecture phase.

- Implemented Milestone 6 Phase 6.5.2D3: Final Launch Confirmation & Milestone 6 Closure — COMPLETE (PASS):

  - Manual Production Smoke Verification:
    * Legitimate administrator production smoke test: PASS. Verified manually by authorized custodian on live production environment (`https://dr-afif.github.io/bls/`). Confirmed successful production login, accessible desktop/mobile administrator shell, clean loading across People, Cohorts, Results/Analytics, and Exports, zero runtime errors, and clean logout.
    * Controlled learner production smoke test: PASS. Verified manually using the retained controlled regression probe (`m***@upm.edu.my`) on live production environment. Confirmed successful production login, accessible learner shell, strict learner authorization preserved, 0 course entitlements, 0 cohort memberships, privileged routes inaccessible (rendering standard Page Not Found boundaries), and clean logout.
    * Instructor authenticated browser smoke: DEFERRED with justification. No legitimate hosted instructor identity currently exists following fixture cleanup. Ephemeral fixture accounts (`instructor@bls.local`) must NOT be recreated in the production environment. Instructor server/RLS authorization remains fully verified by automated pgTAP regression suites. Authenticated instructor UI smoke verification will be conducted when the first legitimate physical course instructor is formally onboarded.
  - Auth Redirect Allowlist Verification:
    * Audited live Supabase Auth configuration against project `zlaixhnyydxgbphgsetv` via Supabase CLI config diff.
    * Confirmed Site URL remains `https://dr-afif.github.io/bls/`.
    * Confirmed additional redirect allowlist is already strictly narrowed to `https://dr-afif.github.io/bls/**` alongside required local development origins (`http://localhost:5173/**`, `http://127.0.0.1:5173/**`). The overly broad `https://dr-afif.github.io/**` pattern was not present; zero mutation was required.
  - Provenance Review Resolved:
    * Re-audited all 23 hosted records whose author/reviewer/approver/publisher provenance fields were reassigned from deleted `admin@bls.local` to custodian `afif89+bls@gmail.com` during Phase 6.5.2D2.
    * Product owner confirmed that cohort `KTGS BANDAR SERI PUTRA` (`KTGS02-0826`) was created personally as TEST DATA during development while logged in as former fixture `admin@bls.local`. It does not represent genuine physical pilot provenance.
    * The reassignment of `cohorts.created_by` is therefore non-blocking and will be purged during the pre-launch clean-slate reset.
    * The remaining 22 records (1 demo cohort, 8 guide resource versions, 2 quizzes, 3 quiz versions, 4 questions, 4 question versions) were confirmed as demonstration/fixture content.
  - Release Gate Assessment & Pre-Launch Clean-Slate Reset Requirement:
    * Milestone 6 TECHNICAL PRODUCTION READINESS is COMPLETE and PASS.
    * Real participant onboarding must NOT begin immediately.
    * A controlled FINAL PRODUCTION CLEAN-SLATE RESET is REQUIRED immediately prior to first real participant onboarding to remove pre-launch operational/test data while preserving operational custodians, schema, RLS, functions, auth settings, SMTP, and audit history.

- Implemented Milestone 6 Phase 6.5.2D2: Hosted Fixture Cleanup & Final Release Re-Gate — COMPLETE (GO):
  - Neutralized and Removed Hosted Fixture Accounts:
    * Identified release blocker in Phase 6.5.2D1: privileged hosted fixture account `admin@bls.local` (`63b48080-9e50-4011-bf57-2a5abf8e9107`) with active sessions, weak temporary dev password, plus `instructor@bls.local` (`a29df73d-5cc8-4a83-9384-0723f75b8664`) and `learner@bls.local` (`2f25eafc-cc99-40d0-9fdb-3cee61de0440`) enrolled in real pilot cohort `KTGS BANDAR SERI PUTRA`.
    * Immediate containment executed: all 3 fixture profiles suspended (`account_status = 'suspended'`), and all active sessions (3) and refresh tokens revoked for `admin@bls.local` (`auth.sessions` = 0, `auth.refresh_tokens` = 0).
    * Dependent rows removed: purged all fixture memberships across real pilot cohort `KTGS BANDAR SERI PUTRA` and `BLS-DEMO-01` (`public.cohort_members` = 0), removed fixture course entitlements (`public.course_entitlements` = 0), and cleaned resource access events.
    * Provenance and audit integrity preserved: transferred author/approver/publisher provenance on seed catalog resources, courses, quizzes, and questions from `admin@bls.local` to authorized production custodian `afif89+bls@gmail.com` (`28dcbd6c-1816-47f7-91ce-15a08f390222`). This satisfied all schema check constraints (`resource_versions_approval_valid`, `approved_question_version_has_provenance`, `published_quiz_version_has_provenance`) and immutability invariants while safely releasing foreign-key cascade locks.
    * Executed official Supabase Auth Admin deletion (`supabase.auth.admin.deleteUser(id, false)`) for all three fixture identities. Verified zero residual records across `auth.users`, `public.profiles`, `public.user_roles`, `auth.sessions`, and `auth.refresh_tokens`. Preserved complete historical audit events (`public.audit_events` = 17 intact).
  - Production Database & Cohort Cleanliness Verified:
    * Hosted `auth.users` count reduced by exactly 3 (from 6 to 3). Only authorized custodians (`afif89@gmail.com`, `afif89+bls@gmail.com`) and controlled test probe (`m***@upm.edu.my`) remain. Zero unexpected or privileged fixture accounts remain.
    * Real pilot cohort `KTGS BANDAR SERI PUTRA` (`46edcfa8-cf05-405b-9b94-947919415482`) completely free of fixture accounts (member_count = 0, attempt_count = 0, status = `scheduled`).
    * Demonstration cohort `BLS-DEMO-01` (`11000000-0000-0000-0000-000000000001`) retained cleanly as isolated demo data (member_count = 0, attempt_count = 0).
    * Controlled regression account `m***@upm.edu.my` remains `active`, role `learner`, 0 cohort memberships, 0 course entitlements.
  - Ephemeral Test Fixture Isolation:
    * Refactored 4 pgTAP regression test files (`reporting_analytics.test.sql`, `staff_results.test.sql`, `quiz_admin_authoring_test.sql`, `quiz_engine_foundation_test.sql`) to provision ephemeral test identities within their isolated `begin; ... rollback;` transaction blocks, decoupling test execution from persistent database state.
    * Confirmed `supabase/seed.sql` remains strictly for local/CI ephemeral test environments; production database is never populated by seed fixtures.
  - Comprehensive Release Verification Re-Run:
    * TypeScript typecheck: passed with 0 errors (`tsc -b --pretty false`).
    * ESLint: passed with 0 errors (`eslint .`).
    * Vitest suite: 33 files, 189 tests passed (100% green).
    * Production build: Vite build completed cleanly in 8.04s.
    * Linked database migrations: 28/28 migrations aligned.
    * Linked schema linter: `supabase db lint --linked --schema public` passed with 0 errors.
    * Linked pgTAP regression suite: all 13 test files, 358 assertions passed (100% PASS) on linked production database with zero residual rows.
    * Hosted security audit: 100% of public tables (29/29) RLS-enabled, private tables deny select, `course-resources` bucket private, Edge Functions `admin-invite-user` (v2) and `issue-resource-access` (v3) active, Custom SMTP enabled on port 465, TokenHash invite template contract intact.
    * Live browser smoke tests: verified unauthenticated route protection returns Page Not Found for `/admin/people` and `/instructor/cohorts`, and login attempt with deleted `admin@bls.local` is rejected with 400 Bad Request ("The email or password is incorrect") with zero unexpected console errors.
  - Release Decision: GO — READY FOR REAL PARTICIPANT ONBOARDING. Privileged fixture-account release blocker is CLOSED.

- Implemented Milestone 6 Phase 6.5.2D: Final Production Verification — COMPLETE:
  - Full Automated Release Verification:
    * Frontend: 33 Vitest test files, 189 tests passed (100% green).
    * Static Analysis: TypeScript typecheck passed with 0 errors; ESLint passed with 0 warnings/errors.
    * Production Build: Vite production build completed successfully in 19.5s; dist bundle verified.
    * Database: 28 migrations verified and 100% aligned between local and linked Supabase project.
    * Schema Linter: Supabase db lint on linked public schema passed with 0 errors.
    * Database Testing: Full pgTAP suite (13 test files, 358 assertions) passed 100% on linked database.
  - Security Architecture & Production Audit:
    * Row Level Security: Verified 100% of public tables (29/29) have RLS enabled (`rowsecurity: true`).
    * Schema Isolation: Verified private schema tables (`private.attempt_answer_scores`, `private.quiz_operation_events`) deny SELECT privilege to both `anon` and `authenticated` browser roles.
    * Function Hardening: Verified 100% of `SECURITY DEFINER` functions in public and private schemas enforce a locked empty search path (`SET search_path = ''`).
    * Storage Privacy: Verified `course-resources` storage bucket is private (`public: false`).
    * Repository Secret Scan: 0 credentials, service-role keys, tokens, or private secrets discovered in git.
  - Live Infrastructure & Services:
    * Edge Functions: Verified `admin-invite-user` (v2, ACTIVE, verify_jwt: true) and `issue-resource-access` (v3, ACTIVE, verify_jwt: true).
    * Auth Configuration: Site URL (`https://dr-afif.github.io/bls/`), redirect allowlist (`https://dr-afif.github.io/bls/**`), leaked-password protection enabled, Custom SMTP configured via dedicated Gmail infrastructure (`smtp.gmail.com:465`).
    * Invitation Template Contract: Hosted template verified to use `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`, with zero `.ConfirmationURL` fallback.
    * Live PWA Shell: Verified `manifest.webmanifest`, app name "BLS Course Companion", standalone display, service worker shell caching with strict API/token exclusion patterns.
  - Production Test Account Disposition:
    * Controlled regression learner (`m***@upm.edu.my`) verified active, strictly learner-only, 0 course entitlements, 0 cohort memberships, audit trail clean.
    * Recommended disposition: Retain active temporarily for immediate post-launch smoke testing, then suspend for permanent regression testing.
  - Release Gate Assessment:
    * Verdict: READY FOR PRODUCTION (READY WITH DOCUMENTED NON-BLOCKING RISKS).

- Implemented Milestone 6 Phase 6.5.2C2: Close Manual Deployment CI Bypass — COMPLETE:
  - Eliminated Production CI Bypass Loophole (`.github/workflows/deploy-pages.yml`):
    * Removed `workflow_dispatch` trigger entirely from `deploy-pages.yml`.
    * Simplified job gating in both `build` and `deploy` jobs to strictly `if: ${{ github.event.workflow_run.conclusion == 'success' }}`.
    * Enforced exact tested SHA checkout without fallback: `ref: ${{ github.event.workflow_run.head_sha }}`.
    * Guaranteed release invariant: production deployment can ONLY occur from a successful `CI` run on `main` testing the exact commit SHA being deployed (`CI tests commit X -> CI succeeds -> deploy workflow receives head_sha X -> checkout X -> build X -> deploy X`).
    * Disabled manual UI actions deployment: eliminated possibility of unverified manual production deployments bypassing CI.
  - Deployment Architecture & Documentation Alignment:
    * Updated `docs/DEPLOYMENT.md`, `PLAN.md`, and `docs/HANDOFF.md` to reflect that manual deployment is intentionally disabled and zero CI bypasses exist.

- Implemented Milestone 6 Phase 6.5.2C1: CI Supply-Chain & Deployment-Gate Correction — COMPLETE:
  - Technical CI Deployment Gate (`.github/workflows/deploy-pages.yml`):
    * Eliminated independent concurrent deployment race on `push: [main]`.
    * Retargeted trigger to `workflow_run: workflows: ["CI"], branches: [main], types: [completed]`.
    * Enforced strict fail-closed release gate: `if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}`. If CI fails, Pages build and deployment jobs are skipped completely.
    * Guaranteed exact-commit deployment: configured `actions/checkout` with `ref: ${{ github.event.workflow_run.head_sha || github.sha }}`, ensuring only the exact tested commit that passed CI is checked out and deployed to production.
  - Supply-Chain Action Pinning Audit:
    * Corrected unpinned `supabase/setup-cli@v1` in `.github/workflows/ci.yml` by pinning to verified upstream commit SHA `supabase/setup-cli@ab058987d8d6c725971f6cf9d0b5c98467e30bd1 # v1.7.1`.
    * Verified 100% of action references across all workflows are pinned to full immutable commit SHAs with release comments.
  - Ephemeral Database Seed Fixture Correction (`supabase/seed.sql`):
    * Resolved foreign key violation in `supabase start` by explicitly inserting baseline fictional users (`admin@bls.local`, `instructor@bls.local`, `learner@bls.local`) into `auth.users`, `public.profiles`, and `public.user_roles` at the start of `seed.sql`, ensuring all subsequent course, cohort, and quiz fixture queries execute cleanly from zero.
  - Deployment Architecture & Documentation Alignment:
    * Updated `docs/DEPLOYMENT.md`, `PLAN.md`, and `docs/HANDOFF.md` to accurately document the technical deployment gate and supply-chain pinning policy.

- Implemented Milestone 6 Phase 6.5.2C: CI / Dependency / Release Hygiene — COMPLETE:
  - Automated CI Pipeline Established (`.github/workflows/ci.yml`):
    * Configured pull-request and main push validation with least privilege (`contents: read`).
    * Frontend job executes clean install (`npm ci`), TypeScript typecheck (`tsc -b --pretty false`), ESLint (`eslint .`), Vitest suite (`npm run test -- --run` — 33 files / 189 tests), and production build (`npm run build`).
    * Ephemeral database CI job starts a fresh local Supabase instance (`supabase start` pinned to CLI 2.117.0), cleanly executing all 28 repository migrations in chronological order from scratch, applies fictional seed fixtures, lints schema (`supabase db lint --local --schema public`), and executes the complete 13-file pgTAP regression suite (358 assertions) with clean container teardown.
    * Decoupled CI from production secrets: ordinary frontend and database CI requires zero Supabase service-role keys or production project connections.
    * Added concurrency cancellation (`cancel-in-progress: true`) for superseded PR runs.
  - Hardened GitHub Pages Deployment Workflow (`.github/workflows/deploy-pages.yml`):
    * Scoped triggers exclusively to `push: [main]` and `workflow_dispatch`, eliminating PR redundancy and preventing PRs without repository variables from failing or canceling active Pages deployments.
  - Dependency & Reproducibility Audit:
    * Executed `npm outdated` and `npm audit`; classified all findings across runtime vs dev, reachability, and severity.
    * Verified `fast-uri` (high) is transitive via `ajv` in `@hookform/resolvers`, unreached as forms use `zod`.
    * Verified `js-yaml` (high) and `@vitest/mocker` (moderate) are development-only tooling dependencies (`eslint` and `vitest`) with zero runtime exposure.
    * Verified `react-router` (moderate) SSR hydration constructor injection is unreached (app is client-side SPA) and open-redirect is mitigated by `createHashRouter` internal route matching.
    * Added `"engines": { "node": ">=22.0.0", "npm": ">=10.0.0" }` to `package.json` to enforce reproducible toolchain standards.
    * Verified `npm ci` succeeds cleanly and builds reproducibly without requiring breaking framework migrations.
  - Operational & Release Hygiene Hardening (`docs/DEPLOYMENT.md`):
    * Established two-tiered Production Release Verification Checklist distinguishing automated CI gates from manual hosted verification checks.
    * Documented mandatory TokenHash template contract drift protection (`{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`) and documented why restoring default `{{ .ConfirmationURL }}` is fatal to hash-based routing.
    * Documented Gmail SMTP operational envelope, platform-custodian secrets boundaries, and future transactional provider decoupling.
    * Documented retention of controlled test account `m***@upm.edu.my` as a non-privileged `learner` regression probe.
  - Roadmap & Documentation Reconciliation:
    * Reconciled wording drift in `PLAN.md` and `docs/HANDOFF.md`, establishing canonical roadmap naming: Phase 6.5.2C is CI / Dependency / Release Hygiene and Phase 6.5.2D is Final Production Verification.

- Implemented Milestone 6 Phase 6.5.2B2B: Controlled Live Invitation Verification — COMPLETE:
  - Verified full production invitation and account lifecycle on live GitHub Pages deployment (`https://dr-afif.github.io/bls/`) against linked Supabase project `zlaixhnyydxgbphgsetv`.
  - Configured custom production SMTP using dedicated Gmail infrastructure (`smtp.gmail.com:465`, SSL, sender name `BLS Course Companion`).
  - Corrected and saved hosted Supabase Auth "Invite User" email template to use TokenHash destination:
    `<a class="button" href="{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>`.
    Documented critical invariant: default Supabase `{{ .ConfirmationURL }}` must never be restored, as it triggers server-side implicit `#access_token=...` hash redirects incompatible with HashRouter and exposing tokens in browser history.
  - Incident containment & reconciliation: an initial controlled test with the default template exposed an implicit hash redirect; access was immediately neutralized (profile updated to `suspended`, all sessions and refresh tokens deleted). Analyzed foreign-key cascade semantics and safely deleted the test user via `auth.admin.deleteUser` preserving historical audit logs (`auth.user.invited` and `profile.account_status_changed`).
  - Clean re-test execution:
    1. Sent single controlled invitation via production People administrator UI to `m***@upm.edu.my` with role `learner` and `unlimited` access.
    2. Edge Function `admin-invite-user` responded with HTTP 200 without exposing service-role keys or invitation tokens.
    3. Invitation email arrived promptly via custom Gmail SMTP with aligned subject and sender identity.
    4. Recipient clicked Accept Invitation; browser navigated to `#/auth/callback?token_hash=...&type=invite`.
    5. `AuthCallbackPage` validated `type=invite`, executed `supabase.auth.verifyOtp`, scrubbed `token_hash` from URL history via `replaceState`, and redirected to `/auth/reset-password`.
    6. Participant established strong password satisfying hosted password policy.
    7. Account status automatically transitioned from `pending_verification` to `active` via database trigger.
    8. Authenticated learner shell loaded successfully with learner navigation only.
    9. Explicitly verified logout and subsequent email/password login through `/auth/login`.
    10. Role isolation verified: account holds strictly `learner` role; zero course entitlements and zero cohort memberships granted automatically; administrative routes (`/app/admin/people`, etc.) remain denied.
  - Controlled test account (`m***@upm.edu.my`) is retained in `active` status for inspection.

- Implemented Milestone 6 Phase 6.5.2B2A: Hosted Provisioning Infrastructure Deployment & Verification:
  - Deployed database migration `20260820090000_milestone_6_user_provisioning_transaction.sql` cleanly to the linked Supabase project; verified 28/28 migrations aligned remotely.
  - Regenerated `src/lib/supabase/database.types.ts` from the linked schema, placing `provision_invited_user` in its authoritative position with exact types.
  - Executed isolated linked pgTAP test `supabase/tests/user_provisioning_transaction_test.sql`: passed all 30/30 assertions remotely.
  - Executed full linked database pgTAP regression suite: passed all 358/358 assertions across 13 test files (100% green).
  - Verified remote function security attributes: `provision_invited_user` and `private.handle_auth_user_confirmed` both have fixed empty search paths (`search_path=""`), are `SECURITY DEFINER`, and have execute permissions strictly granted to `service_role` (denied to `anon` and `authenticated`).
  - Audited hosted URL configuration via `supabase config diff`: verified that hosted `Site URL` is already set to `https://dr-afif.github.io/bls/` and hosted `additional_redirect_urls` contains `https://dr-afif.github.io/bls/**`, `http://localhost:5173/**`, and `http://127.0.0.1:5173/**`.
  - Deployed Edge Function `admin-invite-user` with JWT verification preserved (`verify_jwt = true`); confirmed function status ACTIVE (version 1).
  - Verified non-mutating authorization boundaries:
    * Anonymous POST to `admin-invite-user` rejected at JWT edge gateway with 401 `UNAUTHORIZED_NO_AUTH_HEADER`.
    * Invalid JWT rejected at gateway with 401 `UNAUTHORIZED_INVALID_JWT_FORMAT`.
    * Anonymous PostgREST execution of `provision_invited_user` rejected with 401 / error code `42501` (`permission denied for function provision_invited_user`).
    * Confirmed `auth.users` count remained unchanged at exactly 4 (zero accounts created or deleted).
  - Verified all local frontend regression baselines: 33 Vitest test files (189/189 tests passing), TypeScript typecheck clean (0 errors), ESLint clean (0 errors), and production build successful.
  - Identified remaining manual Dashboard actions before Phase 6.5.2B2B controlled invitations:
    1. Set Edge Function runtime secret `SITE_URL=https://dr-afif.github.io/bls/` in Supabase Dashboard (Project Settings → Edge Functions → Secrets).
    2. Paste repository template `supabase/templates/invite.html` into hosted Supabase Auth "Invite user" email template (Authentication → Email Templates).
    3. Enable "Check for leaked passwords" in Authentication → Password settings.

- Implemented Milestone 6 Phase 6.5.2B1.8: Invitation Template Redirect Contract Correction (Local Implementation):
  - Corrected email template application base variable:
    * In `supabase/templates/invite.html`, updated the Accept Invitation link from `{{ .SiteURL }}` to `{{ .RedirectTo }}`:
      `<a class="button" href="{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite">Accept Invitation</a>`.
    * Solved variable separation: Supabase GoTrue sets `{{ .SiteURL }}` to the project's configured default site URL, while `{{ .RedirectTo }}` reflects the exact `redirectTo` parameter passed to `inviteUserByEmail`.
    * Linked Edge Function contract: `admin-invite-user` passes `redirectTo = "${normalizedBase}/"` (derived from mandatory `SITE_URL`); using `{{ .RedirectTo }}` ensures that the explicit `SITE_URL` runtime environment variable strictly governs the invitation destination URL.
  - Recorded hosted B2A prerequisite:
    * Before sending remote invitations, the hosted Supabase Auth Redirect URL allowlist must explicitly permit the exact production base URL passed as `redirectTo` (`https://dr-afif.github.io/bls/`).
  - Updated template tests in `src/features/auth/templates/invite-template.test.ts`:
    * Added assertions proving the template uses `{{ .RedirectTo }}`, does not use `{{ .SiteURL }}` for the destination, preserves `{{ .TokenHash }}`, `type=invite`, and fragment-based `/auth/callback`.
    * Suite expanded to 8 tests passing.

- Implemented Milestone 6 Phase 6.5.2B1.7: PKCE-Compatible Invitation Acceptance (Local Implementation):
  - Solved GoTrue invitation redirect limitation: Supabase `auth.admin.inviteUserByEmail()` is not
    PKCE-capable and by default redirects with an implicit fragment (`#access_token=...`), which conflicts
    with React Router HashRouter (`/#/auth/callback#access_token=...`) and is rejected by PKCE-configured clients.
  - Implemented TokenHash + `verifyOtp({ token_hash, type: "invite" })` client-side acceptance flow:
    * Created repository-owned email template `supabase/templates/invite.html` using `{{ .TokenHash }}`,
      `type=invite`, and canonical SPA fragment destination `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`.
    * Configured local `supabase/config.toml` under `[auth.email.template.invite]`.
    * Documented that the hosted Supabase Auth "Invite User" template must match this template before Phase 6.5.2B2B invitations.
  - Updated Edge Function `admin-invite-user`:
    * Replaced redirect path with trusted application base URL `${normalizedBase}/` (`SITE_URL`).
    * Preserved Option A fail-closed behavior when `SITE_URL` is absent.
  - Updated `AuthCallbackPage`:
    * Added dedicated TokenHash invitation branch executing `supabase.auth.verifyOtp({ token_hash, type: "invite" })`.
    * Enforced strict type checking (`type === "invite"`); arbitrary/unexpected types fail closed without calling `verifyOtp`.
    * Sanitized URL and history via `window.history.replaceState` immediately upon verification or terminal failure.
    * Preserved existing PKCE password-recovery flow (`?code=...#/auth/callback`) untouched.
    * Confirmed session establishment and routed successfully verified invites to `/auth/reset-password` (`replace: true`).
    * Reconfirmed defense-in-depth: `/auth/reset-password` is protected by `RequireAuthentication` route guard and `ResetPasswordPage` component state checks.
  - Added deterministic test coverage:
    * Created `src/features/auth/templates/invite-template.test.ts` (7 static validation tests).
    * Created `src/features/auth/pages/auth-callback-page.test.tsx` (11 comprehensive callback tests).
    * Updated `supabase/functions/admin-invite-user/handler.test.ts` (29 handler tests passing).

- Implemented Milestone 6 Phase 6.5.2B1.6: Pre-Deployment Provisioning Safety Corrections (Local Implementation):
  - Corrected target-user takeover vulnerability in `public.provision_invited_user`:
    * Added exclusive row locking with `SELECT ... FOR UPDATE` on `public.profiles`.
    * Enforced strictly unprovisioned target invariants: requires `organization_id IS NULL`,
      `account_status = 'pending_verification'`, and 0 existing assigned roles in `public.user_roles`.
    * Rejected established users, existing organization members, and non-pending accounts with error `42501`.
    * Removed destructive role replacement: eliminated `DELETE FROM public.user_roles`. Provisioning
      proves zero roles exist and inserts exactly one allowed initial role (`learner` | `instructor`).
    * Preserved concurrency safety: competing concurrent calls on the same target are serialized by
      the profile row lock, and the second invocation fails invariant checks without mutating.
  - Corrected invitation redirect route:
    * Removed direct non-hash route `/auth/reset-password` from `admin-invite-user` Edge Function.
    * Replaced with canonical SPA hash callback contract: `${siteUrl.replace(/\/+$/, "")}/#/auth/callback`.
    * Adopted Option A for `SITE_URL` configuration: explicit environment variable required; missing
      or empty `SITE_URL` fails closed with 500 `CONFIGURATION_ERROR`.
  - Expanded pgTAP test suite in `supabase/tests/user_provisioning_transaction_test.sql`:
    * Added 16 new assertions covering established user rejection, existing role rejection (learner,
      instructor, admin, super_admin), active/suspended/expired status rejection, state preservation
      under failed takeover, and concurrency serialization (expanded to 30/30 assertions passing locally).
  - Added Edge Function tests covering redirect construction, Option A `SITE_URL` enforcement,
    and takeover compensation isolation, expanding frontend/Edge suite to 31 files and 170/170 tests passing.

- Implemented Milestone 6 Phase 6.5.2B1.5: Provisioning Transaction & Identity-Lifecycle Hardening (Local Implementation):
  - Resolved course entitlement ambiguity: confirmed `public.course_entitlements.course_id`
    is mandatory (`NOT NULL`) and course-specific. Decided generic user invitation provisions
    identity, tenancy, and role, while course/cohort entitlements remain a separate administrative workflow.
  - Established and closed the account status lifecycle: created `on_auth_user_confirmed` trigger
    on `auth.users` to automatically transition provisioned profiles from `pending_verification`
    to `active` upon email verification.
  - Created forward-only local migration `20260820090000_milestone_6_user_provisioning_transaction.sql`
    introducing transactional RPC `public.provision_invited_user`, executing profile, role, and audit
    updates in a single transaction callable exclusively by `service_role` with fixed `search_path = ''`.
  - Refactored `admin-invite-user` Edge Function to execute exactly one transactional RPC call,
    with compensating `auth.admin.deleteUser` on newly created Auth users if provisioning fails,
    and distinct `PROVISIONING_ROLLBACK_FAILED` handling if compensation deletion itself fails.
  - Verified `verify_jwt = true` in `supabase/config.toml` alongside function-level claims validation.
  - Added 14 isolated pgTAP assertions in `supabase/tests/user_provisioning_transaction_test.sql`
    (permissions, provisioning, role validation, rollback, and lifecycle transitions), all passing locally.
  - Added Vitest tests for transactional provisioning, compensation rollback failure, and post-invite
    lifecycle access gates, bringing frontend/Edge test total to 31 files and 163 tests passing.
- Implemented Milestone 6 Phase 6.5.2B1: Secure User Provisioning & Access-State Hardening.
  - Designed and built trusted Supabase Edge Function `admin-invite-user` with
    platform JWT authentication, independent caller claim extraction, active-status
    verification, and organization boundary validation.
  - Enforced strict role-escalation boundary: only `learner` and `instructor` roles
    can be invited; `admin` and `super_admin` invitations are rejected server-side.
  - Implemented access mode handling (`unlimited` vs `limited` window) with future
    expiry validation and optional start date.
  - Added partial-failure compensation: newly invited Auth users are deleted if
    subsequent database profile/role provisioning fails, while pre-existing accounts
    are preserved.
  - Recorded append-only `user.invited` audit events in `public.audit_events` without
    exposing secrets, tokens, or credentials.
  - Hardened security-sensitive access query in `useAccountAccess` with targeted
    `refetchOnWindowFocus: "always"` to immediately detect suspensions and revocations
    on tab focus, preserving global `refetchOnWindowFocus: false` for all other queries.
  - Integrated accessible `InviteUserDialog` into `/app/admin/people` with role-scoped
    visibility, duplicate submission prevention, disabled pending states, and mapped errors.
  - Added comprehensive unit and component tests (21 Edge Function handler tests,
    8 dialog tests, 4 page tests, 2 access-refetch tests), expanding the suite to
    31 test files and 161 tests passing.
- Implemented Milestone 6 Phase 6.5.2A: Production Identity & Safe PWA Shell,
  including canonical "BLS Course Companion" branding, standards-compliant Web
  App Manifest, branded SVG/PNG icons (192, 512, maskable), mobile
  `viewport-fit=cover`, and conservative `bls-shell-v1` service worker strictly
  excluding authenticated Supabase/API data from Cache Storage.

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
- Merged PR #1, deployed the authentication foundation through GitHub Actions,
  configured the hosted Supabase Site URL and redirect allow-list, and
  successfully smoke-tested sign-in, sign-out, and password recovery on the
  deployed application.
- Added cohort operational fields, same-organization and role-matching
  membership invariants, administrator-only lifecycle writes, consolidated
  profile-update RLS, and automatic audit triggers.
- Added a fictional hosted cohort with learner and instructor assignments,
  regenerated database types, and connected authenticated People/Cohorts
  repositories through TanStack Query.
- Replaced the production placeholder with accessible role-specific workspaces:
  administrator People/Cohorts management, instructor assigned-cohort roster,
  and learner physical-course details. The separate `/demo` experience remains
  unchanged.
- Added organization-scoped courses and required cohort-to-course association,
  effective fixed-window/permanent entitlements, BLS topics, teaching stages,
  resource metadata, immutable versions, audiences, taxonomy assignments,
  related resources, and append-only access-event records.
- Added explicit browser grants, deny-by-default RLS, administrator-only
  lifecycle writes, an audited publication RPC, version and organization
  invariants, and resource/classification/entitlement audit triggers.
- Loaded fictional hosted fixtures: one Adult BLS course, two active test-user
  entitlements, six topics, four teaching stages, eight published immutable
  resource versions, and one related-resource link.
- Updated cohort creation to resolve the organization’s published course and
  regenerated public-schema TypeScript types.
- Added the private PDF-only `course-resources` bucket, exact-path
  administrator draft insert policy, service-only authorization/issuance RPCs,
  per-user rate limiting, idempotent audit events, and 40

## Current state

Milestone 6 Phase 6.3 (Secure Question & Item Analysis) has been successfully implemented and verified. All automated and manual testing confirm that the server-owned item analytics RPC correctly aggregates historical submitted attempts. The UI uses these safe aggregates without client-side recalculation.
We are now ready for Milestone 6 Phase 6.4 (if any) or other directives as defined by the overall product direction.

## Last implemented
- Fixed a flaky UUID sort-ordering assumption in `item_analysis.test.sql` to make it order-independent.
- Implemented `get_admin_cohort_item_analysis` RPC for secure question-level assessment analysis.
- Created `ItemAnalysisTable` and related hooks to display item-level and distractor-level stats for cohorts.
- Expanded pgTAP coverage to 292 assertions across 11 files, ensuring question-version separation and accurate aggregates.
- Added comprehensive Vitest behavioural test coverage for the Analytics space.
- Persisted cohort selection across tab navigation using searchParams.

deployed JWT-protected Edge Function
  `issue-resource-access`; it authorizes the verified user, returns a 60-second
  signed URL with no-store headers, and fails closed if signing or audit append
  fails.
- Regenerated hosted database types and smoke-tested signed retrieval for all
  three fictional roles plus unsigned, unauthenticated, non-PDF, unknown
  version, and unapproved-origin denial cases.
- Added a typed production resource catalog repository and TanStack Query hooks
  that assemble the current immutable version, topics, teaching stages, and
  related resources while failing closed on malformed structured snapshots.
- Connected authenticated learner Guides and instructor Teaching Kit routes to
  live RLS-scoped data with URL-preserved search and filters, accessible state
  handling, and adaptive mobile bottom navigation.
- Added live guide/checklist/video presentation patterns and a lazy-loaded
  PDF.js viewer that consumes signed PDF bytes with `cache: no-store`, keeps
  signed URLs out of the DOM and Query cache, exposes page text to assistive
  technology, and applies a visible account/timestamp watermark.
- Added Phase 3 catalog, protected-access, and component tests. The current
  frontend suite contains 39 passing tests across 15 files.
- Realigned the fictional learner entitlement with the learner's current active
  fictional cohort after a previous smoke-test mutation had removed membership
  from the original demonstration cohort. The targeted hosted correction was
  recorded as `course.entitlement_updated` in the audit log.
- Merged PR #4 into `main` at commit
  `bb817de`, and the product owner confirmed that the GitHub Pages deployment
  completed successfully.
- Added the detailed Milestone 4 Phase 4 plan for authenticated administrator
  resource listing, metadata/classification editing, immutable version
  creation, exact-path private PDF upload and rollback, clinical review,
  approval, publication, retirement, preview, audit feedback, and verification.
- Added server-owned resource draft allocation and lifecycle transitions,
  atomic classification replacement, exact-path draft cleanup, immutable
  submitted/approved history, resource-scoped audit events, and stored PDF
  MIME/size readiness checks.
- Applied hosted migrations
  `20260814074046_milestone_4_admin_resource_workflow.sql` and
  `20260814081642_milestone_4_resource_pdf_metadata_validation.sql`, regenerated
  database types, and expanded hosted pgTAP coverage to 143 assertions across
  five files.
- Replaced the authenticated administrator Resources placeholder with live,
  responsive list/create/detail/version routes, URL-preserved filters, stable
  metadata and taxonomy forms, guide/checklist/video/PDF draft forms, exact-path
  private PDF upload and cleanup, review/approval/publication/retirement actions,
  protected preview, and recent audit feedback. `/demo` remains unchanged.
- Added four administrator resource repository tests for no-overwrite PDF upload,
  client file validation, safe hosted-error mapping, and object-before-row draft
  cleanup. The frontend suite now contains 43 tests across 16 files.
- Added the Phase 4.1 Resource Taxonomy route and typed repository/hooks/forms.
  Administrators can add, rename, describe, order, activate, and deactivate BLS
  topics and teaching stages; the page shows text-and-icon status, usage,
  publication blockers, stable slugs, and recent audit activity.
- Applied hosted migration
  `20260817025736_milestone_4_resource_taxonomy_management.sql`, which removes
  authenticated slug updates, prevents taxonomy deletion/deactivation from
  weakening publication invariants, audits taxonomy changes, and tightens
  classification replacement and publication around active labels.
- Applied follow-up migration
  `20260817032632_milestone_4_resource_taxonomy_concurrency_lock.sql`, which
  locks affected resource rows in stable order so deactivation serializes with
  concurrent publication and classification operations.
- Added 21 taxonomy pgTAP assertions and four frontend taxonomy tests. The
  complete suites now contain 164 hosted SQL/RLS assertions across six files
  and 47 Vitest tests across 18 files.
- Added atomic administrator-only question and quiz creation, draft replacement,
  immutable version branching, and publication RPCs with fixed search paths,
  explicit actor/organization checks, restricted grants, and append-only audit
  events. Direct browser writes to the authoring tables are now revoked.
- Added covering indexes for every assessment foreign key identified by the
  hosted performance advisor.
- Added the authenticated administrator Quizzes navigation entry, live quiz
  library, searchable question bank, full-page question and quiz editors,
  ordered published-question composition, fixed safe learner-review policy,
  and audited cohort post-test release controls.
- Added 29 authoring pgTAP assertions and four form-policy unit tests. The
  complete suites now contain 231 hosted SQL/RLS assertions across eight files
  and 54 Vitest tests across 20 files.

## Decisions implemented

- Learners see date, time, venue, instructor, contact, and preparation notes.
- Guides use BLS topic as the primary organization, with resource-type filters.
- Learners see score and topic summary; question review is deferred.
- The prototype includes one current cohort and historical-cohort context.
- Instructors see learner names and pre-test completion status, never answers.
- Teaching Kit uses teaching stage plus topic and type filters.
- An authorized instructor or administrator manually releases the post-test
  after the physical course. The administrator release UI is implemented;
  instructor release UI remains for a later role-workflow pass.
- Planned production exports are roster CSV, quiz results CSV, and combined
  pre-/post-test CSV.

## Latest verification status

- Milestone 6 Phase 6.4 (Audited CSV Exports) on 2026-08-19:
  - Applied forward-only corrective migration `20260819133000_milestone_6_csv_exports_corrections.sql` to hosted project `zlaixhnyydxgbphgsetv` (27 migrations total, remote and local fully aligned).
  - All 328 assertions across 12 pgTAP test files PASS on linked Supabase, including 36 assertions in `supabase/tests/database/exports.test.sql`.
  - Database lint (`npx supabase db lint --linked`) reports 0 schema errors.
  - Security definer export functions audited: narrow search path `''`, non-admin execution revoked, explicit admin same-org authorization checks.
  - Deterministic tie-breaking `qa.id DESC` enforced across all authoritative attempt queries.
  - Strict typecheck and lint pass; 112 Vitest tests pass across 26 files; production build succeeds cleanly; `git diff --check` passes.
  - Learner email contract: `learnerEmail` removed entirely from export contracts, schemas, and CSV columns because `public.profiles` does not contain email and no existing admin path exposes `auth.users.email`.
  - Ephemeral CSV generation verified: RFC-4180 compliance, formula injection defense (`=`, `+`, `-`, `@` neutralization even with leading whitespace), numeric preservation (`-12.5` remains numeric), zero-row headers, and traversal-safe filenames.
  - Audit logging: all 3 export functions write to `public.audit_events` with actor, entity ID, organization ID, export type, row count, and request ID without sensitive PII or answers in metadata.
  - Browser verification (Chrome DevTools MCP) complete:
    - Mobile (320x800), tablet (768x1024), and desktop (1440x900) verified with zero horizontal overflow, stacking cards, responsive column grids, and >=44x44px touch targets.
    - Local navigation between Results tabs and high-contrast visible focus rings verified.
    - Actual CSV downloads triggered and inspected: Cohort Roster (4 columns, no email), Pre-Test Results (10 columns, unsubmitted learners non-fabricated), Post-Test Results (10 columns), and Pre/Post Comparison (11 columns, null learning gains for unpaired learners).
    - Network RPC payloads inspected: zero private or sensitive fields returned (no emails, answers, option IDs, answer keys, or explanations).
    - Browser console inspected: zero React warnings, zero unhandled runtime errors, and zero failed RPC calls.
  - Static security/performance review completed; formal advisor execution deferred to Phase 6.5.
- Milestone 6 Phase 6.3 (Secure Question & Item Analysis) on 2026-08-19: migration `20260819120000_milestone_6_item_analysis.sql` was applied to the schema.
- Hosted `supabase test db --linked` passes all 292 assertions across 11 files, including 25 new item-analysis assertions. A flaky ordering assumption was successfully corrected without altering production logic.
- Regenerated database types compile. Strict typecheck and lint pass; 74 Vitest tests pass across 23 files; `git diff --check` passes.
- Database lint (`npx supabase db lint --linked`) reports no schema errors (only expected `pgtap`/`extensions` warnings).
- The security advisor reports the expected authenticated `security definer` warnings for the new staff RPCs.
- The performance advisor reports no missing indexes for the assessment/analytics queries.
- Milestone 5 Phase 4 (Instructor Assessment Readiness & Staff Results) on 2026-08-18: migration `20260818100000_milestone_5_staff_results.sql` was applied to the schema and successfully passed all pgTAP tests.
- The administrator attempt detail successfully reconstructs attempts from frozen snapshots, protecting historical integrity.
- Milestone 5 Phase 2 verification on 2026-08-17: migrations through
  `20260817081111_enforce_single_assessment_draft.sql` are applied to
  hosted project `zlaixhnyydxgbphgsetv`; a linked dry run identified only the
  intended Phase 5.2 migrations before application, the final dry run is
  current, and linked database lint reports no schema errors.
- Hosted `supabase test db --linked` passes all 231 assertions across eight
  files, including 29 new administrator-authoring authorization, atomicity,
  publication, immutability, and audit assertions.
- Regenerated database types compile. Strict typecheck and lint pass; all 54
  Vitest tests across 20 files pass; the production build passes with 1,851
  transformed modules and only the existing non-blocking main-chunk warning.
- Rendered live-fictional-data verification passes on quiz library, question
  bank, new-question, and new-quiz routes. At 320 and 1440 pixels, the pages
  have no horizontal overflow; route focus reaches `main`; controls and labels
  remain readable; validation focuses the prompt and exposes visible errors;
  and the browser console has no warnings or errors. No hosted assessment
  record was mutated during rendered verification.
- The security advisor reports the existing three informational no-policy
  notices, 23 expected authenticated `security definer` warnings for controlled
  RPCs (including eight new authoring RPCs), and the pre-existing leaked-
  password-protection warning. The performance advisor reports only unused-
  index information and no unindexed foreign keys.
- Post-merge deployment smoke verification for Milestone 5 Phase 2 on 2026-08-18 passed:
  the deployed GitHub Pages application loaded, Quizzes and Questions administrator
  routes were accessible, and an existing question and quiz could be inspected
  with responsive behaviour and no console errors.
- Milestone 5 Phase 1 verification on 2026-08-17: both quiz migrations are
  applied to hosted project `zlaixhnyydxgbphgsetv`; database lint reports no
  schema errors; all 202 pgTAP assertions across seven files pass, including
  the new 38-assertion quiz authorization/scoring suite.
- Regenerated database types compile. Strict typecheck and lint pass; all 50
  Vitest tests across 19 files pass; the production build passes with 1,841
  transformed modules and only the existing non-blocking main-chunk warning.
- The security advisor reports three informational no-policy notices for
  deliberately non-granted internal attempt snapshot/answer tables, expected
  authenticated `security definer` warnings for explicitly controlled RPCs,
  and the pre-existing leaked-password-protection warning. Every new RPC has a
  fixed search path, explicit grants and actor/scope checks, and pgTAP denial
  coverage. The performance advisor reports no warning-level issue.
- Fictional seed reruns now preserve a learner's existing active cohort, align
  the entitlement with it, and avoid mutating immutable published quiz child
  records. The hosted seed contains two published fictional quizzes, four
  published fictional questions, and no clinical guidance.
- Milestone 4 Phase 4.1 final verification on 2026-08-17: strict typecheck and
  lint passed; all 47 Vitest tests across 18 files passed; production build
  passed with 1,841 transformed modules and only the existing non-blocking
  main-chunk warning.
- Hosted `supabase test db --linked` passed all 164 assertions across six files,
  including all 21 taxonomy assertions. Both Phase 4.1 migrations are applied
  to project `zlaixhnyydxgbphgsetv`, and a dry run reports the hosted migration
  history is current. Regenerated `public,graphql_public` types match the
  committed generated TypeScript file.
- Rendered live-fictional-data verification passed on the administrator taxonomy
  route: all six topics and four teaching stages loaded, blocker controls and
  explanations matched assignments, add-form labels and generated-slug state
  were readable, controls measured approximately 44 pixels, 320-pixel reflow
  remained within the configured viewport, and the console had no warnings or
  errors. No hosted taxonomy record was changed during this check.
- Supabase advisors report no new Phase 4.1 security or performance finding.
  Existing intentional authenticated lifecycle-function warnings, the
  leaked-password-protection warning, and pre-traffic unused-index information
  remain unchanged.
- Milestone 4 Phase 4 final verification on 2026-08-14: strict typecheck passed;
  lint passed; all 43 Vitest tests across 16 files passed; production build
  passed with 1,836 transformed modules. The existing non-blocking main-chunk
  warning remains; PDF.js is route split.
- Hosted `supabase test db --linked` passed all 143 assertions across five files,
  including 34 administrator workflow assertions. Both Phase 4 migrations are
  applied to project `zlaixhnyydxgbphgsetv`, and generated TypeScript types match
  the hosted schema.
- Rendered local/live-data administrator verification passed after signing in as
  the fictional administrator: eight resources loaded, filters and version
  history were readable, invalid create submission focused the first field,
  current-version publication was not offered redundantly, the browser console
  had no warnings/errors, and list/version routes had no page overflow at a
  320-by-800 viewport. No hosted fixture resource was mutated during this check.
- Supabase advisors report no critical schema/RLS findings. Nine intentional
  warnings identify the authenticated `security definer` lifecycle functions;
  these are required because direct lifecycle privileges were revoked and each
  function has an empty search path, explicit active same-organization admin
  checks, restricted grants, and pgTAP coverage. Leaked-password protection
  remains disabled; performance notices are unused-index information before
  meaningful traffic.

- Post-merge deployment smoke verification on 2026-08-14 passed: the hosted
  sign-in screen loaded, the fictional instructor account reached its assigned
  cohorts, and Teaching Kit displayed all eight RLS-permitted live resources
  with readable stage/topic/type filters. The verification account was signed
  out and the browser tab was closed afterward.
- Milestone 4 Phase 3 final frontend verification: typecheck passed; lint
  passed; 39 Vitest tests across 15 files passed; production build passed with
  1,825 transformed modules. PDF.js and its worker are route split; the existing
  non-blocking main-chunk warning remains.
- Rendered hosted-data verification passed at 375 by 812 and 1440 by 900:
  learner Guides and instructor Teaching Kit each showed eight RLS-permitted
  resources, filters used readable live taxonomy labels, desktop/mobile
  navigation adapted without horizontal overflow, route focus reached main,
  and the browser console had no warnings or errors.
- Protected PDF verification passed from the approved local origin: the
  one-page fictional PDF rendered from in-memory bytes with extractable screen
  reader text and a visible user/timestamp watermark; no signed Storage URL was
  present in the DOM; logout returned to sign-in; and the final open produced
  exactly one `signed_url_authorized` plus one `signed_url_issued` event.
- Hosted `supabase test db --linked` remains green with 109 assertions across
  four files after the frontend integration. No Phase 3 database migration was
  required.

- Phase 2 migration
  `20260814011444_milestone_4_private_resource_access.sql` is applied; hosted
  migration history now contains all Milestone 4 migrations through Phase 2.
- Hosted `supabase test db --linked`: passed 109 assertions across four files
  (15 identity/access, 23 People/Cohorts, 31 resource catalog, and 40 private
  Storage/access assertions).
- Private bucket inspection: `course-resources` is non-public, PDF-only, limited
  to 20 MiB, and contains exactly the two expected fictional fixture objects.
- Edge Function `issue-resource-access` version 2 is active with platform JWT
  verification enabled. CORS preflight returned 204.
- Hosted smoke checks: learner, instructor, and administrator each received a
  60-second signed URL and retrieved the expected PDF; missing JWT, unsigned
  public object path, non-PDF version, unknown version, and unapproved origin
  were denied.
- Hosted rate-limit smoke check returned ten successes followed by HTTP 429 on
  the eleventh rapid request for the same fictional learner.
- Audit verification found matching `signed_url_authorized` and
  `signed_url_issued` events, with no URL/token material in metadata.
- Final repository verification: typecheck passed; lint passed; 31 Vitest tests
  across 12 files passed; production build passed with 1,815 transformed
  modules and the existing non-blocking main-chunk warning.
- Supabase security advisor has no schema/RLS errors. Its one warning is the
  pre-existing disabled leaked-password protection setting. Performance
  findings are unused-index informational notices expected before meaningful
  application traffic.
- Both fixture PDFs are one page, have extractable text, render without layout
  defects, and visibly state that they are fictional and not clinical guidance.

- Milestone 4 Phase 1 migrations through
  `20260813083756_milestone_4_resource_authorization_audit.sql` are applied to
  hosted project `zlaixhnyydxgbphgsetv`.
- Hosted `supabase test db --linked`: passed 69 assertions across three files
  (15 identity/access, 23 People/Cohorts, and 31 resource/access assertions).
- Hosted fixture verification: one course, two entitlements, eight resources,
  eight immutable versions, six topics, four teaching stages, and one relation.
- Security advisor reports no schema/RLS errors. Its single warning is the
  already documented project-level leaked-password protection setting.
- Performance advisor reports only unused-index informational notices, expected
  before the new resource queries receive application traffic.
- Final Phase 1 frontend verification: typecheck passed, lint passed, all 19
  tests across 11 files passed, and the production build passed with 1,815
  modules transformed and the existing non-blocking main-chunk warning.
- Deployed Milestone 3 smoke testing on 2026-08-13 passed for all three
  fictional roles: administrator People and Cohorts loaded live data; the
  learner saw only permitted physical-course details; the instructor saw the
  assigned cohort and permitted roster; learner and instructor access to
  administrator routes was denied; sign-out returned to login; and the browser
  reported no warnings or errors.
- The deployed smoke test intentionally performed no administrative mutation.
  The hosted audit table contains the three fictional account-provisioning
  events; cohort, membership, and account-status audit triggers remain covered
  by the passing 38-assertion pgTAP suite.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: passed (19 tests across 11 files).
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
- At the identity-foundation checkpoint, the hosted security advisor reported
  zero findings; the current advisor result is recorded above.
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
- PR #1 merged into `main` at commit
  `30574a98b18a57b587472a98c9a4ffad1b19163e`; the GitHub Pages deployment
  completed successfully.
- Product-owner smoke testing confirmed deployed sign-in, sign-out, and
  password-recovery behaviour after the production and local redirect URLs
  were configured in Supabase Auth.
- Hosted Milestone 3 migrations through
  `20260813035236_consolidate_profile_update_policy.sql` are applied.
- Hosted pgTAP suites pass all 38 assertions across identity/access and
  People/Cohorts authorization, invariants, lifecycle writes, and auditing.
- Rendered local browser verification passed for administrator People/Cohorts,
  learner course detail, instructor permitted roster, role routing, sign-out,
  and learner denial from the administrator route.
- Final typecheck, lint, 19 frontend tests, and GitHub Pages production build
  pass (1,815 modules transformed; existing non-blocking chunk warning).
- Supabase security advisor reports no schema/RLS findings. The remaining Auth
  warning is project-level leaked-password protection being disabled.
- Performance advisor reports only expected unused-index informational notices
  before production traffic.

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

- Production learner, instructor, and administrator resource routes plus the
  administrator quiz-authoring routes use hosted fictional data. Authenticated
  learner quiz/result routes are not wired yet; analytics and exports remain
  illustrative or non-functional. No real learner information or clinically
  approved quiz content is present.
- Administrator catalogue and audit reads are deliberately bounded to the most
  recent 100 resources/events (and 500 versions). Cursor pagination, bulk
  operations, automated review reminders, and automated orphan cleanup remain
  deferred until real catalogue scale justifies them.
- Taxonomy usage/blocker summaries are assembled from bounded administrator
  reads of up to 500 resources and 5,000 assignments. The database invariant is
  authoritative and still blocks unsafe deactivation if a future catalogue
  exceeds those UI-summary bounds; pagination or aggregate RPCs are deferred.
- The demo role selector is intentionally separate from authentication and
  authorization.
- Post-test release, attempt timing/limits, frozen assignment, autosave,
  submission, scoring, and administrator authoring/publication are server-
  enforced. Learner attempt UI, instructor release UI, and detailed results
  administration remain for later Milestone 5 phases.
- Private resource Storage, signed access, production resource repositories,
  watermark identity, and PDF viewer wiring are implemented for fictional
  fixtures. Service-worker Cache Storage was audited directly in Phase 6.5.2A,
  confirming zero Supabase/API dynamic data caching.
- Production CSV exports (Cohort Roster, Assessment Results, and Pre/Post Comparison) are fully implemented, verified via unit/component/pgTAP suites, audited, and verified in-browser across mobile, tablet, and desktop viewports.
- Analytics are illustrative and are not calculated from persisted attempts.
- Phase 6.5.2A installable PWA baseline and conservative application-shell caching
  are complete; authenticated data remains online-only and fail-closed.
- On Windows development hosts, local Docker Supabase port binding can conflict with Hyper-V dynamic TCP port exclusions (54265-54364), whereas GitHub Actions CI runs local Supabase ephemerally on Linux runners without port conflicts. Hosted linked verification (`supabase test db --linked`) remains available for manual development checks.
- The installed UI/UX skill package references a missing design-system
  generator, so its documented design and accessibility rules were applied
  directly.
- `npm audit` reports 6 vulnerabilities across 4 areas:
  * `react-router` (2 moderate advisories): authoritative version is locked at `react-router-dom 6.30.4` and `react-router 6.30.4`. SSR hydration constructor injection is unreached (app is client-side SPA) and open-redirect is mitigated by strict internal routing under `createHashRouter`. Full resolution requires React Router v7 migration deferred to post-launch.
  * `fast-uri` (2 high advisories): transitive via `ajv` in `@hookform/resolvers`, unreached because form validation in this application uses `zod` via `@hookform/resolvers/zod`.
  * `js-yaml` (1 high advisory): dev-only subdependency of `eslint`, zero runtime impact.
  * `@vitest/mocker` (1 moderate advisory): dev-only subdependency of `vitest`, zero runtime impact.
- Hosted fixture accounts (`admin@bls.local`, `instructor@bls.local`, `learner@bls.local`) were completely removed prior to launch via supported `auth.admin.deleteUser`. Phase 6.5.2D1 NO-GO blocker is closed.
- Ephemeral test fixture boundary: `supabase/seed.sql` fixtures remain CI/local-test only; the production database must never be populated by seed fixture identities.
- Cohort `KTGS BANDAR SERI PUTRA` (`46edcfa8-cf05-405b-9b94-947919415482`) was confirmed by the product owner to have been created as TEST DATA during development under the former `admin@bls.local` fixture; it is not genuine production pilot provenance. Reassignment of its `created_by` field to custodian `afif89+bls@gmail.com` during fixture cleanup is non-blocking and will be purged during the pre-launch clean-slate reset.
- Demonstration cohort `BLS-DEMO-01` (`11000000-0000-0000-0000-000000000001`) remains available and isolated for demonstration purposes; it will also be purged during the pre-launch clean-slate reset.
- Controlled regression account `m***@upm.edu.my` remains `active` with strictly `learner` role, 0 cohort memberships, and 0 course entitlements as an operational verification probe until the clean-slate reset.
- Final production clean-slate reset boundary: Before onboarding real participants, an operational clean-slate reset must remove pre-launch operational and test data:
  * Operational/test data to remove: `KTGS BANDAR SERI PUTRA` test cohort, `BLS-DEMO-01` demo cohort, demonstration resources and resource versions, fictional quizzes, question banks, and question versions, test memberships and entitlements, test quiz attempts and results, controlled learner regression account once no longer needed, and any other pre-launch fixture data visible in real operational workflows.
  * Infrastructure and system state to preserve: legitimate admin/super-admin custodians (`afif89@gmail.com`, `afif89+bls@gmail.com`), organization and system configuration, database schema and migrations (28/28), Row Level Security policies, Edge Functions (`admin-invite-user`, `issue-resource-access`), Auth URL and redirect configuration, Custom SMTP settings, CI/CD workflows and deployment gates, private storage bucket configuration, and required immutable system/audit history.
- Local/CI seed fixtures (`supabase/seed.sql`) must remain local/CI-only and must NEVER be pushed into the hosted production tenant.
- Verification evidence classification:
  * `live browser authenticated`: verified legitimate administrator live login and shell access across People, Cohorts, Results/Analytics, and Exports with clean logout; verified controlled learner live login, learner shell access, strict authorization boundary, and logout in Phase 6.5.2D3. Instructor authenticated smoke is DEFERRED with justification (no hosted instructor identity currently exists; covered server-side by pgTAP; UI smoke to occur upon first legitimate instructor onboarding).
  * `live browser unauthenticated`: verified route-guard boundaries render Page Not Found for `/admin/people` and `/instructor/cohorts`, and login attempt with deleted `admin@bls.local` is rejected with 400 Bad Request.
  * `server/RLS verified`: verified all 29 public tables enforce RLS, private schema tables deny select, `course-resources` bucket is private, Edge Functions are ACTIVE, and all 13 pgTAP regression files (358 assertions) pass on linked production database.
  * `source verified`: client route guards, HashRouter basename, TanStack Query cache invalidation, and Zod schemas verified in source code.
  * `prior E2E evidence`: E2E invitation, password establishment, and session lifecycle verified under Phase 6.5.2B2.4.
- The OneDrive workspace's `.git` directory remains an inaccessible cloud
  reparse point to command-line Git even though the visible project files are
  hydrated. A healthy replacement clone now exists at
  `C:\Users\DR-AFIF\Documents\GitHub\bls`; use that non-OneDrive checkout for
  Git-based development and publication. Keep the OneDrive copy only until all
  unpublished work has been confirmed in GitHub.

- Phase 7.2A bilingual database migration (`20260924010000_milestone_7_bilingual_foundation.sql`) is local/CI only. It has NOT been deployed to hosted Supabase `zlaixhnyydxgbphgsetv` (`HOSTED_SUPABASE_MUTATIONS = ZERO`). The frontend application provides a backward-compatibility adapter that catches missing remote columns (`42703`) so production GitHub Pages builds run safely against the unmigrated hosted schema.
- Educational guides, video content, and assessment quiz questions/options are not translated in Phase 7.2A. Machine translation is strictly prohibited. Quiz localization with immutable bilingual question snapshots and attempt snapshots is deferred to Phase 7.2B.
- Broad feature-page UI translation (Learner Guides, Quiz Views, Profile Page, Instructor Teaching Kit, Admin Management forms) is deferred to Phase 7.2B.

## Exact recommended next action

Milestone 6 is formally CLOSED (Technical Production Readiness: PASS).
Milestone 7 Phase 7.1 (Schema & Compatibility Foundation) is COMPLETE and formally CLOSED:
- Phase 7.1A (Local/CI Foundation) — PASS
- Phase 7.1A.1 (Local Schema Hardening Pass) — PASS
- Phase 7.1B (Controlled Hosted Schema Deployment & Verification) — PASS
- Phase 7.1 — COMPLETE

Milestone 7 Phase 7.2 (Bilingual Application Foundation):
- Phase 7.2A (Bilingual Locale & Preference Foundation — Local/CI Implementation Only) — COMPLETE (PASS)
- Phase 7.2A.1 (i18n Foundation Correction Pass — Local/CI Implementation Only) — COMPLETE (PASS)
- Phase 7.2 overall status — NOT COMPLETE
- Phase 7.2B (Assessment & Content Localization + Hosted Deployment) — PLANNED (NOT STARTED)

Hosted Supabase Project `zlaixhnyydxgbphgsetv` deployed migrations remain at:
- `20260922010000_milestone_7_enums.sql`
- `20260922020000_milestone_7_schema_foundation.sql`
(Phase 7.2A migration `20260924010000_milestone_7_bilingual_foundation.sql` is NOT deployed to hosted Supabase).

Recommended next action:
1. Review and approve the Phase 7.2A and Phase 7.2A.1 Bilingual Foundation implementation.
2. Proceed to Phase 7.2B: Content & Assessment Localization + Hosted Migration Deployment.
3. Do NOT deploy migration 20260924010000 to hosted Supabase until Phase 7.2B is approved for hosted rollout.
4. Do NOT execute the production clean-slate reset at this time (reserved for post-7.7 pre-launch).
5. Do NOT mutate hosted production data or seed fixtures during development.
