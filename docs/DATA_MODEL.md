# Data Model

## Conventions

- UUID primary keys
- `timestamptz` timestamps
- `created_at` and `updated_at` where relevant
- Immutable historical records where required
- Soft retirement or archival for published learning data
- Foreign keys with explicit delete behaviour
- Row Level Security on all browser-accessible tables

## Identity and organization

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key and `auth.users.id` |
| `full_name` | text | Required (collected at first-time registration) |
| `staff_id` | text | Optional or organization-required |
| `phone` | text | Optional |
| `profession` | text | Optional |
| `organization_id` | uuid | Required organization scope |
| `department` | text | Optional |
| `preferred_language` | text | `en` (default/fallback) or `ms` |
| `account_status` | enum | `pending_verification`, `pending_registration`, `pending_approval`, `active`, `suspended`, `expired`, `archived` |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

### `private.learner_identities` (Milestone 7 — Protected Private Schema Identity Boundary)

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | Primary key references `public.profiles(id)` on delete cascade |
| `id_type` | text | `mykad` (default) or `passport` |
| `id_number` | text | Normalized full identification number (restricted private storage) |
| `verified_at` | timestamptz | Optional administrative verification timestamp |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

- **Schema Boundary**: Located in `private` schema. Direct SELECT privilege is DENIED to all browser roles (`anon`, `authenticated`).
- **Access Interfaces**: Exposed strictly through `SECURITY DEFINER` RPCs with locked `search_path`:
  - `get_my_learner_identity()`: learner reads own identity.
  - `update_my_learner_identity(...)`: learner updates own identity during registration.
  - `get_learner_identity_for_admin(...)`: administrator reads full identity within organization scope.
  - `get_cohort_roster_for_instructor(...)`: instructor reads cohort roster with server-derived masked identifier (`******-**-1234`). Full values never appear in network payloads.
- **Server-Derived Masking**: Masked strings are computed dynamically on the server (`'******-**-' || right(id_number, 4)` for MyKad). No mutable redundant column is stored.
- **Database Shape Validation vs Semantic Validation**:
  - `mykad`: Canonical database shape validation verifies strictly 12 numeric digits (`^[0-9]{12}$`). Semantic calendar DOB, Malaysian state codes, and checksum verification are deferred to the trusted Phase 7.5 registration validation layer.
  - `passport`: Canonical database shape validation verifies uppercase trimmed alphanumeric representation 6–20 characters (`^[A-Z0-9]{6,20}$`). Universal international passport format validation is not claimed.
  - Constraint: `UNIQUE (id_type, id_number)`. Duplicate registration fails safely with generic error messaging to prevent identity enumeration. Full IDs are never logged.

### `user_roles`

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | References `public.profiles(id)` on delete cascade |
| `role` | enum | `learner`, `instructor`, `admin`, `super_admin` |
| `created_at` | timestamptz | Required |
| `created_by` | uuid | References `public.profiles(id)` on delete set null |

### `organizations`

- `id`
- `name`
- `slug`
- `active`
- `created_at`

### `cohorts`

- `id`
- `organization_id`
- `code`
- `name`
- `name_ms` (Optional localized name)
- `description`
- `description_ms` (Optional localized description)
- `venue`
- `start_at`
- `end_at`
- `status` (`draft`, `scheduled`, `active`, `completed`, `cancelled`, `archived`)
- `learner_access_state` (`open`, `closed` — controls learner entitlement gating)
- `contact_name`
- `contact_phone`
- `preparation_notes`
- `created_by` (uuid references `public.profiles(id)` on delete set null)
- `created_at`
- `updated_at`
- *Legacy `course_id` is preserved as `NOT NULL` in Phase 7.1A with automatic mirroring to `cohort_courses` (with NULL schedule/venue overrides so parent cohort values are dynamically inherited). It will be retired / made nullable during the Phase 7.6 multi-course write cutover.*

### `cohort_courses` (Milestone 7 — Multi-Course Join Model & Schedule Overrides)

| Column | Type | Notes |
|---|---|---|
| `cohort_id` | uuid | References `public.cohorts(id)` on delete cascade |
| `course_id` | uuid | References `public.courses(id)` on delete restrict |
| `display_order` | integer | Non-negative display sequence |
| `start_at` | timestamptz | Optional per-course schedule start override (null inherits cohort `start_at`) |
| `end_at` | timestamptz | Optional per-course schedule end override (null inherits cohort `end_at`) |
| `venue` | text | Optional per-course venue override (null inherits cohort `venue`) |
| `created_at` | timestamptz | Required |
| `created_by` | uuid | References `public.profiles(id)` on delete set null |

- Primary key: `(cohort_id, course_id)`. Every learner enrolled in the cohort receives entitlements to all attached courses.
- Schedule Constraint: `CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)`.
- Inheritance Semantics: When override fields are NULL, applications and invitation emails dynamically resolve the parent cohort's values via `coalesce(...)`. Legacy mirroring and backfill insert NULL overrides so parent schedule/venue updates are never shadowed. The legacy compatibility trigger will be retired during the Phase 7.6 multi-course write cutover.

### `cohort_learner_roster` (Milestone 7 — Pre-Invitation Learner Roster Staging)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `organization_id` | uuid | References `public.organizations(id)` on delete restrict |
| `cohort_id` | uuid | References `public.cohorts(id)` on delete cascade |
| `email` | text | Normalized lowercase email address |
| `roster_status` | text | `staged`, `invited`, `activated`, `removed` |
| `user_id` | uuid | Linked user profile (null until account exists; on delete set null) |
| `added_by` | uuid | References `public.profiles(id)` on delete set null |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

Unique constraint: `(cohort_id, email)`.

### `staff_access_entries` (Milestone 7 — Durable Staff Authorization Intent)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `organization_id` | uuid | References `public.organizations(id)` on delete restrict |
| `email` | text | Normalized lowercase staff email address |
| `intended_role` | text | `admin`, `instructor` (check constraint) |
| `status` | text | `staged`, `activated`, `removed` (check constraint) |
| `user_id` | uuid | Linked user profile (null until account exists; on delete set null) |
| `added_by` | uuid | References `public.profiles(id)` on delete set null |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

- **Purpose**: Durable organizational intent for administrative and teaching staff before `auth.users` exists.
- **Hierarchy Rules**: `super_admin` may stage `admin` or `instructor`; `admin` may stage `instructor` only; no workflow may stage `super_admin`.
- **Constraint**: Table-level `UNIQUE (organization_id, email, intended_role)` prevents duplicate active/staged intent while allowing soft-removed records to be restored.
- **Account Safety**: Removal transitions `status` to `removed` and never deletes established user accounts.

### `access_invitations` (Milestone 7 — 7-Day Invitation Engine & Attempt Log)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `organization_id` | uuid | References `public.organizations(id)` on delete restrict |
| `cohort_roster_entry_id` | uuid | Nullable reference to `public.cohort_learner_roster(id)` on delete restrict |
| `staff_access_entry_id` | uuid | Nullable reference to `public.staff_access_entries(id)` on delete restrict |
| `invitation_type` | text | `new_learner_cohort`, `existing_learner_cohort`, `staff_bootstrap` |
| `email` | text | Normalized invitee email |
| `intended_role` | text | `learner`, `instructor`, `admin` |
| `status` | text | `prepared`, `sent`, `redeemed`, `expired`, `failed`, `superseded` |
| `token_hash` | text | Unique SHA-256 hash (64-char lowercase hex) of one-time application invite secret (nullable when prepared) |
| `sent_at` | timestamptz | Timestamp of actual dispatch (nullable when prepared) |
| `expires_at` | timestamptz | Exact 7-day validity timestamp from actual send (`sent_at + interval '7 days'`) |
| `redeemed_at` | timestamptz | Timestamp of successful consumption |
| `redeemed_by_user_id` | uuid | User who redeemed the invitation (on delete set null) |
| `invited_by` | uuid | Actor who issued the invitation (on delete set null) |
| `supersedes_invitation_id` | uuid | Reference to previous attempt superseded by a resend (on delete restrict) |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

- **Target Referential Integrity**: `CHECK ((cohort_roster_entry_id IS NOT NULL AND staff_access_entry_id IS NULL) OR (cohort_roster_entry_id IS NULL AND staff_access_entry_id IS NOT NULL))` ensures every invitation attempt links to exactly one durable authorization intent target. Targets and superseded attempts are protected against deletion (`ON DELETE RESTRICT`).
- **Dispatch Timing & Expiry**: Validity begins strictly upon actual dispatch (`sent_at`). Prepared rows do not run down the 7-day clock. Exact 7-day validity is enforced by database constraint `CHECK (expires_at = sent_at + interval '7 days')`. Invariant `effective_expired = (status = 'sent' AND expires_at <= now())` is enforced dynamically without dependency on cron jobs.
- **Token Hash Format**: Verified via check constraint `CHECK (token_hash IS NULL OR token_hash ~ '^[0-9a-f]{64}$')`. Raw invitation tokens are never stored.
- **Status Lifecycle & Historical Preservation**: Database constraints require `token_hash`, `sent_at`, and `expires_at` on all `sent`, `redeemed`, `expired`, and `superseded` rows. Changing status from `sent` to `expired`/`superseded`/`redeemed` cannot null historical send fields.
- **Supersession Lineage**: A new attempt can only supersede a prior attempt for the same authorization intent target (same roster entry or same staff access entry). Resends create a fresh attempt row referencing `supersedes_invitation_id`. Partial unique indexes ensure at most one active (`prepared` or `sent`) attempt per intent target.

### `cohort_members`

- `cohort_id` (references `public.cohorts(id)` on delete cascade)
- `user_id` (references `public.profiles(id)` on delete cascade)
- `member_role` (`learner`, `instructor`)
- `membership_status` (`active`, `completed`, `removed`)
- `joined_at`
- `completed_at`
- `added_by` (references `public.profiles(id)` on delete set null)

Primary key: `(cohort_id, user_id)`. The legacy `one_active_cohort_per_learner` partial index is preserved throughout Phase 7.1A and will be removed at the Phase 7.6 application cutover once multi-cohort UI and switcher workflows exist. Assigned instructors may read the cohort roster with masked I.C.s; learners read only their own membership.


## Courses and access

### `courses`

- `id`
- `organization_id`
- `slug`
- `title`
- `description`
- `status`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Milestone 4 Phase 1 implements one organization-scoped Adult BLS course record
and requires every cohort to reference a course. The course is an access and
content boundary for the physical-course companion, not a self-paced pathway.

### `course_entitlements`

- `id`
- `organization_id`
- `user_id`
- `course_id`
- `cohort_id`
- `access_type`
- `starts_at`
- `expires_at`
- `activated_at`
- `status`
- `granted_by`
- `granted_at`
- `revoked_by`
- `revoked_at`
- `revocation_reason`

Suggested access types:

- permanent
- fixed_window

Suggested statuses:

- pending
- active
- expired
- revoked

### Effective access

The implemented private database helper determines effective access using:

- Account status
- Entitlement status
- Start time
- Expiry time
- Revocation
- Course publication state
- Optional active cohort membership when the entitlement names a cohort

The browser can read only its own entitlement, while administrators can grant,
update, expire, or revoke entitlements inside their organization. Grant and
revocation changes are audited.

## Resource taxonomy

### `bls_topics`

- `id`
- `organization_id`
- `slug`
- `name`
- `description`
- `display_order`
- `active`
- `created_at`
- `updated_at`

### `teaching_stages`

- `id`
- `organization_id`
- `slug`
- `name`
- `description`
- `display_order`
- `active`
- `created_at`
- `updated_at`

Topics support learner-first browsing; teaching stages support instructor-first
browsing. Referenced taxonomy records are retired rather than deleted.

## Versioned resources

### `resources`

- `id`
- `organization_id`
- `course_id`
- `slug`
- `title`
- `resource_type`
- `estimated_minutes`
- `featured`
- `status`
- `available_from`
- `available_until`
- `current_version_id`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Suggested resource types:

- guide
- checklist
- youtube_video
- pdf

Resources are stable metadata records. Learners and instructors can read only
published, currently available records that match their effective course
access and assigned audience.

### `resource_versions`

- `id`
- `resource_id`
- `version_number`
- `resource_type`
- `title`
- `summary`
- `content`
- `youtube_video_id`
- `storage_path`
- `content_hash`
- `guideline_source`
- `guideline_year`
- `reviewed_by`
- `reviewed_at`
- `next_review_at`
- `status`
- `approved_by`
- `approved_at`
- `created_by`
- `created_at`

Guide and checklist bodies are immutable structured snapshots. PDF paths and
YouTube identifiers are version-specific locators. Approved versions and any
version selected as current cannot be updated or deleted by browser roles.
Publishing uses the audited `publish_resource_version` RPC and requires an
approved version plus at least one audience and topic.

### Resource classification and relations

- `resource_audiences(resource_id, audience)`
- `resource_topics(resource_id, topic_id, display_order)`
- `resource_teaching_stages(resource_id, teaching_stage_id, display_order)`
- `resource_relations(resource_id, related_resource_id, display_order)`

Assignment triggers prevent cross-organization taxonomy or cross-course
relations. Audience, taxonomy, and relation changes are audited.

### `resource_access_events`

- `id`
- `organization_id`
- `user_id`
- `resource_id`
- `resource_version_id`
- `action`
- `request_id`
- `metadata`
- `created_at`

Suggested event types:

- signed_url_authorized
- signed_url_issued
- opened
- closed
- video_played
- video_paused
- video_progress
- video_seeked
- pdf_page_viewed

The table is append-only and browser roles have no direct insert or raw-read
privileges. Phase 2 adds service-role-only authorization and issuance functions
that record idempotent signed-PDF access events without persisting URLs,
tokens, IP addresses, or unnecessary device data. Authorization validates the
active account, role, organization, effective entitlement, optional cohort
membership, instructor assignment, resource audience, publication window,
current immutable PDF version, and exact Storage path before signing.

### Private PDF objects

The private `course-resources` bucket accepts only PDFs up to 20 MiB. Object
names are immutable, version-specific paths:

`<organization-id>/<resource-id>/<version-id>/<safe-name>.pdf`

Authenticated browser roles have no object `SELECT`, `UPDATE`, or `DELETE`
policy. An active same-organization administrator may insert only the exact
recorded path for a draft, non-current PDF version. The deployed
`issue-resource-access` Edge Function uses the service-only database functions
to issue a 60-second signed URL after authorization and auditing.

## Quiz model

### `quizzes`

- `id`
- `course_id`
- `title`
- `quiz_type`
- `status`
- `passing_score`
- `time_limit_minutes`
- `attempt_limit`
- `cooldown_minutes`
- `show_score`
- `show_answers`
- `show_explanations`
- `randomize_questions`
- `randomize_options`
- `question_count`
- `requires_resources_complete`
- `version`
- `available_from`
- `available_until`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Suggested quiz types:

- pre_test
- post_test
- practice
- remediation
- topic

### `questions`

- `id`
- `organization_id`
- `current_version_id`
- `created_by`
- `created_at`
- `retired_at`

### `question_versions`

- `id`
- `question_id`
- `version`
- `question_type`
- `question_text`
- `explanation`
- `reference_text`
- `difficulty`
- `status`
- `guideline_source`
- `guideline_year`
- `created_by`
- `reviewed_by`
- `reviewed_at`
- `next_review_at`
- `created_at`

### `question_options`

- `id`
- `question_version_id`
- `option_text`
- `display_order`
- `is_correct`

Learners must never be able to select `is_correct` directly.

### `question_topics`

- `question_id`
- `topic_id`

### `topics`

- `id`
- `organization_id`
- `name`
- `description`

### `quiz_questions`

For fixed quizzes:

- `quiz_id`
- `question_id`
- `display_order`
- `points`

### `quiz_question_rules`

For randomized quizzes:

- `id`
- `quiz_id`
- `topic_id`
- `difficulty`
- `question_count`
- `points_each`

### `quiz_attempts`

- `id`
- `user_id`
- `quiz_id`
- `quiz_version`
- `status`
- `started_at`
- `expires_at`
- `submitted_at`
- `score`
- `maximum_score`
- `percentage`
- `passed`
- `duration_seconds`
- `submission_idempotency_key`
- `created_at`

Suggested statuses:

- in_progress
- submitted
- timed_out
- invalidated

### `attempt_questions`

- `id`
- `attempt_id`
- `question_version_id`
- `display_order`
- `points`
- `option_order_snapshot`

### `attempt_answers`

- `id`
- `attempt_question_id`
- `selected_option_ids`
- `answer_payload`
- `saved_at`
- `submitted_at`
- `is_correct`
- `points_awarded`

Correctness and points must be calculated server-side.

## Completion and certificates

### `course_completions`

- `id`
- `user_id`
- `course_id`
- `completed_at`
- `completion_version`
- `completion_reason`
- `verified_by`

### `certificates`

- `id`
- `user_id`
- `course_id`
- `certificate_number`
- `issued_at`
- `expires_at`
- `verification_code`
- `storage_path`
- `status`
- `issued_by`

## Administration and communication

### `announcements`

- `id`
- `organization_id`
- `course_id`
- `title`
- `body`
- `published_at`
- `expires_at`
- `created_by`

### `registration_codes`

- `id`
- `code_hash`
- `course_id`
- `cohort_id`
- `usage_limit`
- `usage_count`
- `expires_at`
- `active`
- `created_by`

### `notification_queue`

- `id`
- `user_id`
- `notification_type`
- `payload`
- `scheduled_at`
- `sent_at`
- `status`
- `failure_reason`

### `audit_events`

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `organization_id`
- `metadata`
- `created_at`
- `request_id`

Audit records should be append-only for normal administrators.

## Analytics

### `daily_analytics`

Optional aggregate table:

- `metric_date`
- `organization_id`
- `course_id`
- `metric_name`
- `metric_value`
- `dimensions`

### Index priorities

Create indexes for:

- `course_entitlements(user_id, course_id, status)`
- `course_entitlements(expires_at)`
- `resources(course_id, section_id, display_order)`
- `resource_progress(user_id, resource_id)`
- `quiz_attempts(user_id, quiz_id, started_at)`
- `quiz_attempts(quiz_id, submitted_at)`
- `attempt_questions(attempt_id, display_order)`
- `audit_events(created_at)`
- `audit_events(actor_user_id, created_at)`
- `cohort_members(cohort_id, user_id)`
