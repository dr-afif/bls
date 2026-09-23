# BLS Course Companion Implementation Plan

## Objective

Deliver a secure, accessible, responsive companion application for physical
Basic Life Support courses.

The product must support:

- Learners attending an in-person course.
- Instructors delivering the physical course.
- Administrators managing people, cohorts, resources, quizzes, results, and
  access.

It must not be designed as a self-paced LMS.

## Required continuity reading

Before planning or implementing work, read:

1. `docs/PRODUCT_DIRECTION.md`
2. `docs/HANDOFF.md`
3. This plan

Update `docs/HANDOFF.md` when a milestone ends, the product direction changes,
or work pauses for a user decision.

## Current checkpoint — Resources and teaching materials

### Completed

- Long-term architecture and security documentation
- React, TypeScript, Vite, Tailwind, and React Router foundation
- Frontend-only learner-oriented prototype
- Corrected in-person course-companion product brief
- Current-interface audit
- Revised role-based information architecture
- Low-fidelity screen descriptions
- Three visual-direction proposals
- Approved Direction A for learner and instructor experiences and Direction C
  density for administrator screens
- Approved role navigation and cohort visibility
- Approved guide and Teaching Kit organization
- Approved local post-test release-state prototype
- Approved score and topic-summary learner result detail
- Approved planned export set
- Implemented distinct learner, instructor, and administrator route trees
- Removed the LMS pathway, lesson, completion, and progress-dashboard patterns
- Completed owner-approved proxy validation with six simulated role personas
- Approved the prototype information architecture for backend planning
- Evaluated and declined the HeroUI React v3 and Tailwind CSS v4 migration for
  the current production milestone
- Recorded the conservative MVP authorization policies and created the initial
  local Supabase identity/access migration, seed, and pgTAP RLS suite
- Completed and deployed the hosted identity/access and frontend authentication
  foundation, including role routing, sign-out, session restoration, and
  password recovery
- Configured GitHub Pages deployment and the Supabase Auth production/local
  redirect allow-list
- Completed hosted People and Cohorts schema, RLS, audit triggers, fictional
  fixtures, typed repositories, and authenticated role-specific interfaces

### Current work

- Follow the phased implementation and verification sequence in
  [`docs/MILESTONE_4_IMPLEMENTATION_PLAN.md`](docs/MILESTONE_4_IMPLEMENTATION_PLAN.md).
- Phase 1 is complete: resource metadata, immutable versions,
  audience/topic/stage taxonomy, course entitlements, publication controls,
  table RLS, auditing, fictional fixtures, and hosted pgTAP tests are in place.
- Phase 2 is complete: the private `course-resources` bucket, exact-path draft
  PDF insert policy, service-only authorization RPCs, JWT-protected
  `issue-resource-access` Edge Function, 60-second signed URLs, rate limiting,
  idempotent auditing, fictional PDF fixtures, and hosted tests are deployed.
- Phase 3 is complete: production learner Guides and instructor Teaching Kit
  use typed RLS-backed reads, URL-preserved filters, related resources, and a
  protected in-memory PDF viewer with a visible watermark and safe states.
- Phase 4 implementation is complete in
  [`docs/MILESTONE_4_PHASE_4_PLAN.md`](docs/MILESTONE_4_PHASE_4_PLAN.md), including
  server-owned lifecycle transitions, private PDF validation and cleanup,
  administrator routes/forms, audit feedback, protected preview, and responsive
  verification.
- Phase 4.1 resource taxonomy management is implemented and hosted-verified in
  [`docs/MILESTONE_4_PHASE_4_1_TAXONOMY_PLAN.md`](docs/MILESTONE_4_PHASE_4_1_TAXONOMY_PLAN.md):
  administrators can add, edit, order, activate, and safely deactivate BLS
  topics and teaching stages with server-enforced publication invariants and
  auditing.
- Phase 4.1 was merged through PR #5 at commit
  `271dd9b480ba7435145c5cbf47fdb893cb13ff03`; its deployed administrator smoke
  test remains part of the Milestone 4 release follow-up.
- Milestone 5 Phase 1 was merged through PR #6 and deployed from `main`; see
  [`docs/MILESTONE_5_PHASE_1_QUIZ_FOUNDATION_PLAN.md`](docs/MILESTONE_5_PHASE_1_QUIZ_FOUNDATION_PLAN.md).
- Milestone 5 Phase 2 administrator authoring and post-test release is
  implemented and hosted-verified on branch
  `agent/milestone-5-phase-2-admin-quiz-authoring`; see
  [`docs/MILESTONE_5_PHASE_2_QUIZ_AUTHORING_PLAN.md`](docs/MILESTONE_5_PHASE_2_QUIZ_AUTHORING_PLAN.md).
- Keep quiz fixtures non-clinical and fictional. Publish Phase 5.2, then build
  the authenticated learner availability, attempt, autosave, submission, and
  personal-result journey in Phase 5.3.
- Milestone 6 Phase 6.1 (Secure Reporting Foundation), Phase 6.2 (Administrator Cohort Analytics UI), and Phase 6.3 (Secure Question & Item Analysis) are implemented and verified.

## Milestone 1 — Role-aware frontend prototype

This milestone remains frontend-only. Use fictional local data and small
repository interfaces.

**Status:** complete; approved for backend planning using owner-accepted proxy
validation. Independent representative-user validation remains desirable but
is not a release gate at this checkpoint.

### Learner experience

- Home with physical-course cohort details
- Quick guides
- Guides library with search and topic filters
- Guide, document, and video viewer patterns
- Pre-test and post-test availability
- Personal result summary
- Profile and account-status states

### Instructor experience

- Home with next physical teaching session
- Teaching-stage shortcuts
- Teaching Kit search and filters
- Launch-ready video, guide, and checklist patterns
- Assigned-cohort summary
- Profile and access states

### Administrator experience

- Desktop-first responsive shell
- Overview focused on upcoming cohorts and actionable exceptions
- People management
- Cohort creation and membership assignment
- Resource library
- Quiz-content management
- Results and basic analytics
- Settings placeholders

### Shared quality requirements

- Mobile-first learner and instructor layouts
- Desktop-first responsive administrator layouts
- WCAG 2.2 AA target
- Visible keyboard focus and route focus management
- Minimum practical 44 by 44 pixel touch targets
- Statuses use text and icons as well as colour
- Loading, empty, offline, access-denied, expired, and error states
- No LMS pathways, completion dashboards, or gamification
- No backend or real user data

### Verification

- Typecheck
- Lint
- Relevant unit and component tests
- Production build
- Browser validation at small-phone, landscape/tablet, and desktop widths
- Keyboard, zoom/reflow, and reduced-motion spot checks

### Exit criteria

- Representative users can locate common guides or teaching materials within
  one or two taps.
- Each role has a distinct, coherent information architecture.
- The physical-course context is obvious.
- No screen implies self-paced module completion.
- The prototype is approved for backend planning.

## Milestone 2 — Production architecture and authentication

Begin only after the frontend information architecture is validated.

**Status:** complete; deployed and smoke-tested against the hosted development
project. The unavailable local Docker stack remains a documented development
limitation.

### Backend

- Local Supabase environment
- Schema migrations and seed fixtures
- Supabase Auth
- Profiles and roles
- Account status
- Row Level Security foundations
- Audit-event foundations
- Generated TypeScript database types

### Frontend

- Login, invitation, verification, reset, and logout
- Auth provider
- Role-aware protected routes
- Account-status and access guards
- Production repository implementations behind existing interfaces

### Exit criteria

- Authentication and authorization are enforced server-side.
- Browser-accessible tables have tested RLS.
- No real-user data is exposed across roles or cohorts.
- Administrative Auth actions run in a trusted environment.

## Milestone 3 — People and cohorts

**Status:** complete in the hosted fictional development environment.

### Backend

- People/profile administration
- Cohorts and physical-course schedule
- Instructor assignments
- Learner membership
- Access status
- Scoped administrative policies
- Audit events

### Frontend

- People search, filters, detail, and account status
- Cohort list and detail
- Cohort schedule and venue
- Instructor and learner assignment
- Actionable incomplete-cohort states

### Exit criteria

- Administrators can manage the essential course-operations lifecycle.
- Users see only permitted cohort information.
- All material administrative changes are audited.

## Milestone 4 — Resources and teaching materials

**Status:** complete. Phase 4.1 was merged through PR #5; the deployed
administrator smoke test remains a release follow-up rather than an
implementation blocker.

### Backend

- Resource metadata and immutable versions
- Audience, BLS topic, and teaching-stage taxonomy
- Private Supabase Storage
- Short-lived authorized access
- Publication and clinical-review states
- Resource-access audit events

### Frontend

- Learner Guides library
- Instructor Teaching Kit
- Search and filters
- Accessible video player
- Protected PDF or document viewer
- Related resources
- Resource administration

### Exit criteria

- Frequently used resources are reachable within one or two taps.
- Protected files are not public or cached by the service worker.
- Resource organization does not imply an LMS pathway.

## Milestone 5 — Pre-test, post-test, and results

**Status:** active. Phase 1 secure backend foundation is merged and deployed.
Phase 2 administrator authoring and cohort post-test release are implemented
and hosted-verified; branch publication and deployed smoke testing remain. The
authenticated learner journey is not yet implemented.

### Backend

- Quiz, question, option, and immutable-version records
- Controlled attempt start
- Frozen question assignment
- Autosaved draft answers
- Idempotent server-side submission and scoring
- Attempt, timing, and release enforcement
- Review-policy enforcement

### Frontend

- Quiz availability and release explanation
- Quiz instructions
- Accessible question flow
- Autosave and offline states
- Submission confirmation
- Personal learner results
- Administrative question and quiz editing

### Exit criteria

- Learners cannot read correct answers before policy permits.
- Learners cannot write final scores.
- Historical attempts remain interpretable.
- Post-test release follows the approved physical-course rule.

## Milestone 6 — Analytics, exports, and hardening

**Status:** complete; formally closed. Technical production readiness is PASS. Pre-launch clean-slate reset is REQUIRED immediately prior to first real participant launch.
- Phase 6.1 (Reporting & Analytics Foundation) — COMPLETE.
- Phase 6.2 (Administrator Cohort Analytics UI) — COMPLETE.
- Phase 6.3 (Secure Question & Item Analysis) — COMPLETE.
- Phase 6.4 (Audited CSV Exports) — COMPLETE.
- Phase 6.5 (Production Hardening & Launch Readiness) — COMPLETE:
  - Phase 6.5.1 (Production Readiness Audit & Plan) — COMPLETE.
  - Phase 6.5.2A (Production Identity & Safe PWA Shell) — COMPLETE.
  - Phase 6.5.2B (User Invitation & Account Lifecycle) — COMPLETE:
    - Phase 6.5.2B1 (Secure User Provisioning & Access-State Hardening — Local Implementation) — COMPLETE.
    - Phase 6.5.2B1.5 (Provisioning Transaction & Identity-Lifecycle Hardening) — COMPLETE.
    - Phase 6.5.2B1.6 (Pre-Deployment Provisioning Safety Corrections) — COMPLETE.
    - Phase 6.5.2B1.7 (PKCE-Compatible Invitation Acceptance) — COMPLETE.
    - Phase 6.5.2B1.8 (Invitation Template Redirect Contract Correction) — COMPLETE.
    - Phase 6.5.2B2A (Hosted Provisioning Infrastructure Deployment & Verification) — COMPLETE.
    - Phase 6.5.2B2B (Controlled Live Invitation Verification) — COMPLETE.
  - Phase 6.5.2C (CI / Dependency / Release Hygiene) — COMPLETE:
    - Phase 6.5.2C1 (CI Supply-Chain & Deployment-Gate Correction) — COMPLETE.
    - Phase 6.5.2C2 (Close Manual Deployment CI Bypass) — COMPLETE.
  - Phase 6.5.2D (Final Production Verification) — COMPLETE:
    - Phase 6.5.2D1 (Final Evidence Completion & Production Fixture Audit) — RETURNED NO-GO.
    - Phase 6.5.2D2 (Hosted Fixture Cleanup & Final Release Re-Gate) — COMPLETE (GO).
    - Phase 6.5.2D3 (Final Launch Confirmation & Milestone 6 Closure) — COMPLETE:
      * Technical Production Readiness: PASS.
      * Administrator live browser smoke: PASS (verified manually by authorized custodian).
      * Controlled learner live browser smoke: PASS (verified manually with retained regression probe).
      * Instructor live browser smoke: DEFERRED (no hosted instructor identity exists after fixture cleanup; verified server-side via pgTAP; UI smoke to occur upon first legitimate instructor onboarding).
      * Provenance review: RESOLVED (`KTGS BANDAR SERI PUTRA` confirmed as test data created under former fixture; non-blocking).
      * Final Production Clean-Slate Reset: REQUIRED immediately prior to first real participant onboarding.

### Product

- Cohort pre-/post-test comparison
- Individual results
- Operational readiness summaries
- Required CSV exports
- Question analysis where justified

### Hardening

- Accessibility audit
- Security review
- Performance review
- Safe PWA application-shell caching
- Monitoring, backup, rollback, and recovery
- Production deployment documentation

### Exit criteria

- Reports respect role and cohort scope.
- Charts have text and table alternatives.
- No unresolved critical security or accessibility findings remain.

## Milestone 7 — Controlled onboarding, multi-course cohorts, and bilingual foundation

**Status:** planned (architecture & documentation complete in [`docs/MILESTONE_7_ONBOARDING_ARCHITECTURE_PLAN.md`](docs/MILESTONE_7_ONBOARDING_ARCHITECTURE_PLAN.md); implementation pending review and approval).

### Objectives

1. Support controlled email-only learner roster entry (`public.cohort_learner_roster`), delegating full name and I.C. collection to first-time registration.
2. Implement durable staff authorization intent (`public.staff_access_entries`) before Auth accounts exist, adhering to strict hierarchy: super-admin stages admin/instructor; admin stages instructor; instructors manage assigned cohorts only.
3. Manage a resilient 7-day application invitation lifecycle (`public.access_invitations`) referencing exactly one authorization intent target, with anti-scanner defense, server-derived effective expiry, and superseding resend.
4. Support immediate cohort enrollment for existing active learners upon invitation dispatch, plus a one-time passwordless return link without forced password changes or personal data re-registration.
5. Migrate cohorts to multiple courses via `cohort_courses` join table with optional per-course schedule and venue overrides (`start_at`, `end_at`, `venue`).
6. Provide a reversible `learner_access_state` gate (`open` | `closed`) at the cohort level.
7. Isolate sensitive national identity (I.C.) numbers in `private.learner_identities` (denying direct browser SELECT) with server-derived masked identifiers for instructors.
8. Establish a bilingual application foundation supporting English (`en`, default/fallback) and Bahasa Melayu (`ms`), with separate human-authored content and frozen bilingual quiz questions.

### Phase Plan

- **Phase 7.1 — Schema & Compatibility Foundation**:
  - **Phase 7.1A / 7.1A.1 (Local/CI Foundation — COMPLETE)**: Deploy additive schema foundation for `public.cohort_courses` (with dynamic inheritance via NULL overrides and compatibility mirror from legacy `cohorts.course_id`), `public.cohort_learner_roster`, `public.staff_access_entries`, `public.access_invitations` (attempt history referencing exactly one intent target, target deletion restricted, 64-char lowercase hex token hash format, exact 7-day validity `expires_at = sent_at + interval '7 days'`, status lifecycle preserving historical send fields, same-target supersession lineage hardening, and no generic metadata), `private.learner_identities` (in `private` schema with browser access revoked, canonical 12-digit MyKad and 6-20 uppercase alphanumeric Passport shape validation), `learner_access_state` enum (`open`, `closed`), and `pending_registration` account state.
  - **Sequencing Safeguards**: Retain `one_active_cohort_per_learner` partial index until Phase 7.6 when multi-cohort UI exists. Retain `cohorts.course_id` (NOT NULL) until Phase 7.6 cutover. Retain existing `private.handle_auth_user_confirmed()` lifecycle (confirmations route to `active`, not `pending_registration`) until Phase 7.5 registration UI exists. Technical spikes are required before their dependent feature implementations (Spike 1 before Phase 7.3; Spike 2 before Phase 7.5), not before Phase 7.1 schema work.
- **Phase 7.2 — Bilingual Application Foundation**:
  Client-side translation framework (`useTranslation()`), locale dictionaries (`en.ts`, `ms.ts`), profile language preference, bilingual metadata schema, and fallback behavior.
- **Phase 7.3 — Email Transport Spike & Staff Bootstrap**:
  Execute Email Transport Spike to evaluate and verify supported server-side mail transport. Implement `public.staff_access_entries` management, role hierarchy enforcement (`super_admin` -> admin/instructor; `admin` -> instructor; no self-assignment; no super-admin creation in UI), and first legitimate instructor onboarding.
- **Phase 7.4 — Cohort Roster & Invitation Engine**:
  Manual learner email addition, bulk paste/CSV validation preview (new, existing, duplicate, invalid, conflict), separated roster addition vs invitation dispatch. Immediate enrollment activation of membership and entitlements for existing active users. 7-day token lifecycle with server-derived effective expiry and superseding resend.
- **Phase 7.5 — Passwordless Return Spike, First-Time & Returning User Registration**:
  Execute Passwordless Return Link Spike. Intermediary landing page (anti-scanner defense), new learner registration form (full name, normalized 12-digit MyKad or Passport with safe duplicate protection, preferred language, password), atomic completion RPC into `private.learner_identities`. Returning user one-time passwordless return token exchange.
- **Phase 7.6 — Multi-Course Access + Close/Restore**:
  Cut over RLS helpers and application queries to `cohort_courses` (resolving schedule/venue overrides), attach/detach multiple courses per cohort, reversible cohort access close/restore, and individual learner removal/re-add.
- **Phase 7.7 — E2E Production Verification**:
  Comprehensive Vitest, pgTAP, and Playwright verification across all roles, multi-course access, I.C. privacy, 7-day expiry, bilingual flows, and PWA shell integrity.
- **Post-7.7 Release Gate**:
  Controlled final production clean-slate reset immediately prior to first real participant launch.


## Deferred work

- Certificates and public verification
- Practical-skills assessment sign-off
- Multiple organizations
- Native wrapper
- Secure managed offline content
- Advanced analytics and item discrimination
- Advanced bulk administration
- Stronger tokenized video hosting
- Automated clinical-guideline review reminders
