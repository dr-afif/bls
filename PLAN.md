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
- Proceed to Phase 4 planning for administrator resource lifecycle,
  classification, immutable version creation, private PDF upload, review,
  approval, publication, retirement, and audit feedback.
- Keep quizzes, results, analytics, and exports fictional until later milestones.

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

**Status:** active; Phases 1 through 3 are complete. Phase 4 administrator
resource workflow is next.

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
