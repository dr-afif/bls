# Changelog

All notable changes to the BLS Learning PWA should be documented in this file.

The project uses a `Major.Minor.Patch` versioning convention.

## [Unreleased]

### Added

- Hosted People and Cohorts operations with cohort scheduling, existing-user
  assignment, retained membership lifecycle states, account access changes,
  role-scoped learner/instructor reads, and append-only audit events
- Authenticated administrator People/Cohorts screens, instructor assigned
  cohort roster, learner physical-course detail, loading/error/empty states,
  and responsive production workspace navigation
- Milestone 3 pgTAP coverage for organization isolation, role matching,
  administrator writes, learner/instructor reads, historical membership, and
  automatic auditing
- GitHub Actions verification and deployment workflow for the Vite production
  build on GitHub Pages, with public Supabase values supplied through repository
  variables
- Three fictional, audited hosted-development accounts for learner, instructor,
  and administrator authentication smoke testing
- Invite-only Supabase email/password sign-in, sign-out, password recovery,
  persistent session restoration, and accessible authentication screens
- Typed account/profile/role bootstrap with active-account and role-aware route
  guards backed by the existing RLS-protected identity tables
- TanStack Query provider, React Hook Form and Zod validation, validated public
  environment configuration, and an explicit unconfigured-deployment state
- Production access landing screens that keep protected learning content out of
  scope while preserving the clearly labelled fictional demo at `/demo`
- Initial local Supabase configuration, identity/access migration, fictional
  organization seed, explicit Data API grants, deny-by-default RLS policies,
  and pgTAP authorization tests
- Hosted Supabase development foundation with applied identity/access schema,
  fictional organization seed, generated TypeScript database types, and
  covering indexes for identity/access foreign keys
- Production policy decisions for quiz review, cohort membership, post-test
  release, exports, and auditability
- Validation-readiness documentation and testing materials
- Canonical product-direction brief defining the application as a companion for
  physical BLS courses rather than a self-paced LMS
- Operational development handoff for continuity across development sessions
- Interface audit, revised role-based information architecture, low-fidelity
  screen descriptions, and the approved Clinical Field Guide / Operational
  Course Companion visual direction
- Continuity instructions requiring future agents to read the product direction,
  handoff, and plan before implementation
- First frontend-only React, TypeScript, Vite, and Tailwind prototype
- Public demo entry with a local-only role selector and explicit prototype boundaries
- Responsive learner and instructor shells with desktop sidebars and mobile
  top and bottom navigation
- Desktop-first responsive administrator shell and operational navigation
- Learner Home, Guides, Quiz, Results, Profile, and resource-viewer screens
- Instructor Home, Teaching Kit, Cohorts, Profile, and presentation-view screens
- Administrator Overview, People, Cohorts, Resources, Quizzes, Results, and
  Settings screens
- Local post-test release-state preview and explicitly non-functional planned
  export controls
- Reusable loading, empty, offline, expired-access, access-denied, and error states
- Small role-aware repository interfaces and fictional demo data for future
  backend replacement
- Accessible UI primitives, semantic design tokens, and initial component tests

### Changed

- Replaced authenticated People and Cohorts placeholder data with typed
  Supabase repositories while retaining local fictional resources, quizzes,
  results, analytics, exports, and the separate `/demo` route tree
- Regenerated TypeScript database types and advanced the active checkpoint to
  Resources and Teaching Materials
- Deployed the merged authentication foundation through GitHub Actions and
  verified hosted sign-in, sign-out, and password recovery after configuring
  the Supabase Auth Site URL and redirect allow-list
- Marked the production architecture and authentication foundation complete
  before proceeding through the People and Cohorts milestone
- Configured an explicit `/bls/` production base path for GitHub Pages while
  keeping local Vite development at `/`
- Verified the local frontend against the hosted development project's public
  Auth endpoint and confirmed anonymous profile access remains denied by the
  existing database grants and RLS boundary
- Made the production authentication entry the root route while retaining all
  existing demo routes and mock repositories
- Updated compatible dependencies and removed all high-severity npm audit
  findings; a React Router v7 migration remains deferred as a breaking change
- Accepted the simulated-persona findings as owner-approved proxy validation,
  approved the prototype information architecture for backend planning, and
  retained an explicit evidence boundary around the absence of recruited users
- Completed the deferred component-system evaluation and retained the existing
  Radix/shadcn-style components and Tailwind CSS v3 instead of adopting HeroUI
  React v3 and Tailwind CSS v4
- Reframed the frontend from an LMS-style learner pathway to a resource-first
  companion for a physical BLS course
- Removed dashboard progress, sequential course, lesson, completion-gate, and
  continue-learning patterns
- Adopted warm off-white surfaces, deep navy primary, restrained teal accent,
  compact status-led administration, minimal shadow, and shared role tokens
- Initial product specification
- Initial architecture and technical specification
- Initial UI and component catalogue
- Initial data model
- Initial authentication and access model
- Initial security and content-protection model
- Initial resource and quiz specifications
- Initial analytics plan
- Initial PWA and offline rules
- Initial accessibility requirements
- Initial testing and deployment plans
- Initial acceptance-test catalogue
- Initial roadmap and architecture decisions

### Fixed

- Corrected standalone state heading semantics (accessibility improvement)
- Improved compact prototype/demo-data labeling on mobile to prevent overflow
- Made the pgTAP authorization suite portable to the hosted Supabase CLI test
  runner by explicitly selecting the database-owner role and extensions schema

### Security

- Clarified that authentication, authorization, secure quiz scoring, protected
  storage, and auditability are mandatory before real user data is introduced
- Defined private-storage requirement for PDFs
- Defined server-side scoring requirement
- Defined RLS requirement for browser-accessible data
- Defined prohibition against frontend secret keys
- Defined protected-content service-worker restrictions
- Verified all 15 identity/access RLS assertions against the hosted development
  database, with zero security-advisor findings and no real users introduced

## Versioning guidance

- Increment **Major** for incompatible architecture, schema, API, or data-contract changes.
- Increment **Minor** for backward-compatible user-visible features.
- Increment **Patch** for backward-compatible fixes, tests, documentation, and maintenance.
