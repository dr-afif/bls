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
| `full_name` | text | Required |
| `staff_id` | text | Optional or organization-required |
| `phone` | text | Optional |
| `profession` | text | Optional |
| `organization_id` | uuid | Nullable for single-organization MVP |
| `department` | text | Optional |
| `account_status` | enum | Verification and approval state |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

### `user_roles`

| Column | Type |
|---|---|
| `user_id` | uuid |
| `role` | enum |
| `created_at` | timestamptz |
| `created_by` | uuid |

Suggested roles:

- learner
- instructor
- admin
- super_admin

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
- `description`
- `venue`
- `start_at`
- `end_at`
- `status`
- `contact_name`
- `contact_phone`
- `preparation_notes`
- `created_by`
- `created_at`
- `updated_at`

The implemented Milestone 3 schema enforces unique case-insensitive cohort
codes within an organization, an end time after the start time, and audited
administrator-only browser writes.

### `cohort_members`

- `cohort_id`
- `user_id`
- `member_role`
- `membership_status`
- `joined_at`
- `completed_at`
- `added_by`

Implemented membership validation requires the profile and cohort to share an
organization and requires `member_role` to match an assigned application role.
Learners may have only one active membership; removed and completed records are
retained rather than deleted. Assigned instructors may read the permitted
roster, while learners read only their own membership.

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
