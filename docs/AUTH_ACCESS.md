# Authentication and Access

## Authentication

Use Supabase Auth for:

- Invite-only email and password account activation
- Email verification
- Login
- Logout
- Password reset
- Session refresh
- Optional future Google login

## Registration modes

### Invite-only

Implemented default. Public self-registration is not exposed in the frontend.

An administrator creates an invitation. The invited user verifies the email, completes the profile, and receives the configured entitlement.

### Open signup with approval

Anyone may create an account, but new users remain `pending_approval` until an administrator approves them.

### Registration code

A user signs up and enters a code linked to a cohort or course. Codes may have an expiry and usage limit.

## Account states

- `pending_verification`
- `pending_approval`
- `active`
- `suspended`
- `expired`
- `archived`

## Roles

### Learner

- View own profile
- View entitled courses
- View permitted resources
- Record own progress
- Start eligible quizzes
- View own permitted results
- View own certificates

### Instructor

- Learner permissions
- View assigned cohorts
- View assigned learners' progress and results
- Add feedback where enabled

### Administrator

- Manage users in scope
- Manage cohorts
- Grant and revoke access
- Manage courses, resources, questions, and quizzes
- View scoped analytics
- Export reports
- View scoped audit records

### Super administrator

- Manage administrators
- Manage system-wide settings
- View all organizations and audit records
- Perform high-impact archival or deletion operations

## Course entitlement types

### Permanent

- `access_type = permanent`
- `expires_at = null`

### Fixed window

- Explicit `starts_at`
- Explicit `expires_at`

### Duration from activation

- `duration_days`
- `activated_at` set on first successful course activation
- `expires_at` calculated server-side

### Revoked

Revocation immediately overrides all date calculations.

## Effective-access checks

A protected action should confirm:

1. User is authenticated.
2. Account status is active.
3. Course exists and is published.
4. Entitlement belongs to the user.
5. Entitlement is not revoked.
6. Start time has been reached.
7. Expiry time has not passed.
8. Resource or quiz publication window is valid.
9. Prerequisites are complete where required.

## Grace period

Optional behaviour after entitlement expiry:

- Allow results view
- Allow certificate view
- Deny resources
- Deny new quiz attempts

Grace-period access must be explicit and server-enforced.

## Session handling

- Persist sessions in browser storage through Supabase Auth.
- Automatically refresh valid tokens.
- Detect auth callback parameters.
- Show a clear session-expired state.
- Do not store access tokens in custom application state longer than necessary.
- Avoid logging tokens.

## Administrative Auth operations

These must run through an Edge Function or another trusted server context:

- Invite user
- List Auth users
- Suspend or ban user
- Delete Auth user
- Force session revocation
- Change verified email
- Administrative password reset actions

## Access administration workflow

1. Administrator selects user.
2. Administrator selects course.
3. Administrator selects access type.
4. Application validates dates or duration.
5. Server function applies the entitlement.
6. Audit event is recorded.
7. Relevant queries are invalidated.
8. User sees updated access on next authorized request.

## Bulk access

Bulk assignment should:

- Validate every row
- Produce a preview
- Reject or isolate invalid records
- Apply changes transactionally where practical
- Return success and failure counts
- Create a summary audit event and per-user details where required

## Route guards

Frontend route guards improve navigation but do not provide security.

Recommended guards:

- `RequireAuthentication`
- `RequireActiveAccount`
- `RequireRole`
- `RequireCourseEntitlement`
- `RequireQuizEligibility`

## Current implementation boundary

The frontend currently provides:

- Validated public Supabase browser configuration
- Persistent PKCE Auth sessions and automatic token refresh
- Email/password sign-in and sign-out
- Password-reset request, callback, and password-update screens
- Profile, account-status, and role bootstrap through RLS-protected tables
- Frontend guards for authentication, active account status, and application role
- Explicit states for missing profiles, missing roles, pending, suspended,
  expired, archived, configuration, network, and unauthorized access

Public sign-up, administrative Auth actions, real course entitlements,
protected resources, quiz security, and server-side scoring remain outside this
milestone. Frontend guards are navigation controls only; RLS remains the data
authorization boundary.
