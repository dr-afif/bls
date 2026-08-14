# Changelog

All notable changes to the BLS Learning PWA should be documented in this file.

The project uses a `Major.Minor.Patch` versioning convention.

## [Unreleased]

### Added

- Authenticated administrator Resources workspace with URL-preserved search and
  lifecycle/audience/topic/teaching-stage filters, bounded live catalogue reads,
  responsive resource cards, stable metadata and classification editing,
  immutable version history, recent audit feedback, and protected current-
  version preview
- React Hook Form and Zod resource/version forms for guide, checklist, PDF, and
  YouTube records, including visible validation, pending states, server-safe
  errors, approximately 44-pixel controls, and mobile reflow at 320 pixels
- Server-owned draft allocation, review submission/evidence, approval,
  publication, retirement, classification replacement, PDF readiness, and safe
  draft-discard functions with explicit administrator checks and grants
- Exact-path draft PDF delete policy, Storage API cleanup, no-overwrite upload,
  private-file status recovery, and MIME/non-empty/20 MiB metadata validation
- Thirty-four Phase 4 lifecycle/Storage pgTAP assertions and four focused
  frontend repository tests; the complete suites now contain 143 SQL/RLS
  assertions and 43 Vitest tests
- Detailed Milestone 4 Phase 4 administrator-resource plan covering lifecycle
  transition hardening, exact-path private PDF upload and rollback, visible
  orphan recovery, full-page administration routes, accessible review and
  publication workflows, and the end-to-end verification matrix
- Milestone 4 Phase 3 typed production resource repository and TanStack Query
  hooks, including validated immutable guide/checklist snapshots, topic and
  teaching-stage taxonomy, relations, and stable learner-safe failures
- Authenticated learner Guides and instructor Teaching Kit routes with live
  Supabase data, URL-preserved search and filters, responsive resource lists,
  related resources, and loading, empty, offline, denied, expired, rate-limit,
  and recoverable error states
- Lazy-loaded PDF.js protected-document renderer that requests a signed URL
  only when opened, immediately fetches PDF bytes with `cache: no-store`, keeps
  the URL out of the DOM and TanStack Query, provides extractable page text for
  assistive technology, and overlays a visible user-specific watermark
- Eight focused Phase 3 unit/component tests covering catalog assembly,
  malformed immutable snapshots, protected-file access and cache options,
  offline and denial states, filtering, and readable taxonomy controls
- Milestone 4 Phase 2 private `course-resources` Storage bucket, PDF-only
  20 MiB limit, version-specific fictional PDF fixtures, and reproducible
  bucket seeding configuration
- JWT-protected `issue-resource-access` Edge Function with verified-user
  authorization, 60-second signed URLs, restrictive CORS handling, safe error
  responses, and explicit no-store headers
- Service-only PDF authorization and issuance RPCs with complete entitlement,
  role, organization, publication, audience, and version checks; per-user rate
  limiting; idempotent request handling; and append-only access events
- Forty hosted pgTAP assertions for private Storage and PDF authorization plus
  twelve dependency-injected Edge Function tests
- Detailed Milestone 4 Phase 2 private-Storage and authorized-PDF-access plan,
  including current Edge Function authentication, rate-limit, idempotency,
  audit, cache, rollback, and verification decisions
- Milestone 4 Phase 1 course, entitlement, BLS topic, teaching-stage, resource,
  immutable-version, audience, relation, and access-event schema
- Organization-scoped resource RLS, effective-entitlement helpers, audited
  publication RPC, lifecycle/classification audit triggers, and 31 new pgTAP
  assertions for resource authorization and immutability
- Fictional hosted Adult BLS taxonomy, two course entitlements, and eight
  versioned published resource records for subsequent interface development
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

- Authenticated administrator navigation now includes Resources and uses a
  three-column compact navigation layout without page overflow at 320 pixels
- Regenerated TypeScript database types after applying the Phase 4 lifecycle
  schema and advanced Milestone 4 to review/publication verification
- Production learner and instructor workspaces now use adaptive navigation:
  labelled bottom navigation on small screens and horizontal workspace
  navigation at larger breakpoints, with reserved safe-area spacing and
  44-pixel-or-larger interaction targets
- The learner production route guard now permits only learner accounts; the
  separate instructor route tree remains role guarded and both continue to
  rely on database RLS for authorization
- The fictional learner course entitlement was realigned to the learner's
  current active fictional cohort after a prior smoke test left the original
  demonstration membership removed; the targeted hosted correction has a
  corresponding audit event
- Regenerated TypeScript database types from the hosted Phase 2 schema and
  advanced Milestone 4 to Phase 3 resource-catalog/viewer integration planning
- Cohorts now require an organization-matching course, cohort creation resolves
  the organization’s published course, and generated database types reflect the
  Milestone 4 Phase 1 schema
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

- Removed direct authenticated writes to resource-version allocation,
  lifecycle actors/timestamps, resource publication pointers, and
  classification tables; narrow functions now verify active same-organization
  administrators and serialize parent-before-version transitions
- Restricted browser-side private-file deletion to the exact unreferenced draft
  path, preserved the absence of browser list/read/update policies, and required
  valid stored PDF MIME and size metadata before review, approval, or publication
- Kept protected PDFs private with no browser read, list, update, move, or
  delete policy; only active same-organization administrators may insert the
  exact recorded path for a draft PDF version
- Verified hosted learner, instructor, and administrator signed-PDF access,
  unsigned-object denial, unapproved-origin denial, non-PDF/unknown-version
  denial, no-JWT denial, 60-second expiry configuration, and URL-free audit
  metadata
- Enforced learner/instructor resource audience, publication window, active
  account, course-entitlement, cohort-assignment, and organization boundaries
  in PostgreSQL RLS; browser roles cannot forge resource-access events
- Made approved and historically selected resource versions immutable and
  restricted publication to active same-organization administrators through an
  audited function
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
