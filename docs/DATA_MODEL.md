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
- `name`
- `description`
- `start_at`
- `end_at`
- `status`
- `created_at`
- `updated_at`

### `cohort_members`

- `cohort_id`
- `user_id`
- `joined_at`
- `added_by`

## Courses and access

### `courses`

- `id`
- `organization_id`
- `title`
- `slug`
- `description`
- `thumbnail_path`
- `status`
- `version`
- `pre_test_required`
- `resources_in_order`
- `published_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### `course_entitlements`

- `id`
- `user_id`
- `course_id`
- `cohort_id`
- `access_type`
- `starts_at`
- `expires_at`
- `duration_days`
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
- duration

Suggested statuses:

- pending
- active
- expired
- revoked

### Effective access

The database should determine effective access using:

- Account status
- Entitlement status
- Start time
- Expiry time
- Revocation
- Course publication state
- Optional grace policy

## Course content

### `course_sections`

- `id`
- `course_id`
- `title`
- `description`
- `display_order`
- `status`
- `created_at`
- `updated_at`

### `resources`

- `id`
- `course_id`
- `section_id`
- `title`
- `description`
- `resource_type`
- `youtube_video_id`
- `storage_path`
- `estimated_minutes`
- `is_required`
- `completion_rule`
- `display_order`
- `status`
- `available_from`
- `available_until`
- `current_version_id`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Suggested resource types:

- youtube_video
- pdf
- article
- image
- external_link
- interactive

### `resource_versions`

- `id`
- `resource_id`
- `version`
- `title`
- `description`
- `youtube_video_id`
- `storage_path`
- `content_hash`
- `guideline_source`
- `guideline_year`
- `status`
- `approved_by`
- `approved_at`
- `created_by`
- `created_at`

### `resource_progress`

- `id`
- `user_id`
- `resource_id`
- `resource_version_id`
- `status`
- `progress_percent`
- `first_opened_at`
- `last_opened_at`
- `completed_at`
- `last_position`
- `updated_at`

Suggested statuses:

- not_started
- in_progress
- completed

### `resource_events`

- `id`
- `user_id`
- `resource_id`
- `resource_version_id`
- `event_type`
- `event_at`
- `payload`
- `session_id`

Suggested event types:

- opened
- closed
- video_played
- video_paused
- video_progress
- video_seeked
- pdf_page_viewed
- completed

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
