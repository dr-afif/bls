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

### Administrator user provisioning (`admin-invite-user`)

Phase 6.5.2B1 implements a trusted server-side administrator invitation boundary:

- **Endpoint**: Supabase Edge Function `admin-invite-user` with JWT verification.
- **Caller authentication**: Validates authenticated Bearer token and resolves caller claims.
- **Caller authorization**: Requires active account status and `admin` or `super_admin` role. Regular admins may only invite users to their own organization; cross-organization provisioning is rejected (`ORGANIZATION_MISMATCH`).
- **Role escalation boundary**: Invitations are strictly restricted to `learner` and `instructor` target roles. Inviting an `admin` or `super_admin` is rejected with `UNSUPPORTED_ROLE`.
- **Access mode**: Supports `unlimited` (standard) or `limited` (time-bounded access window with validated future `expires_at` and optional `starts_at`).
- **Idempotency & compensation**: If database provisioning fails after creating a new Auth user, the newly created Auth user is compensated (`deleteUser`) to prevent orphaned un-provisioned records. Existing registered users return `USER_ALREADY_EXISTS` (409) and are never deleted.
- **Audit logging**: Every successful invitation appends a `user.invited` audit event to `public.audit_events` with actor, target user ID, organization, role, and access mode (no secret tokens or credentials recorded).
- **Access-state refresh hardening**: `useAccountAccess` query specifies `refetchOnWindowFocus: "always"` to promptly revalidate account status and roles when switching back to the application tab, while maintaining global focus refetch disabled for non-security queries.

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

The frontend and local backend currently provide:

- Validated public Supabase browser configuration.
- Persistent PKCE Auth sessions and automatic token refresh.
- Email/password sign-in and sign-out.
- Password-reset request, callback, and password-update screens.
- Profile, account-status, and role bootstrap through RLS-protected tables.
- Frontend guards for authentication, active account status, and application role.
- Explicit states for missing profiles, missing roles, pending, suspended,
  expired, archived, configuration, network, and unauthorized access.
- Targeted security-sensitive account query hardening with `refetchOnWindowFocus: "always"`
  while leaving global window-focus refetching disabled.
- Administrator invitation workflow (`admin-invite-user` Edge Function and `InviteUserDialog`).
- Transactional database provisioning via `public.provision_invited_user` RPC, callable
  exclusively by `service_role` with strict role-escalation boundary (`learner` | `instructor` only).
- Strictly create-only provisioning and target takeover prevention (Phase 6.5.2B1.6):
  1. Exclusive row lock: `provision_invited_user` acquires a `SELECT ... FOR UPDATE` lock on `public.profiles`.
  2. Unprovisioned target invariants: rejects targets where `organization_id IS NOT NULL`,
     `account_status <> 'pending_verification'`, or existing rows exist in `public.user_roles`.
     Established users, existing members, active/suspended/expired accounts cannot be reprovisioned.
  3. No destructive role replacement: eliminated `DELETE FROM public.user_roles`. Provisioning
     proves zero existing roles and inserts exactly one permitted initial role (`learner` | `instructor`).
  4. Concurrency safety: competing invocations on the same pending profile are serialized by the
     row lock; the second competing invocation fails invariant validation and aborts with error `42501`.
- Account status lifecycle:
  1. `admin-invite-user` invites recipient via GoTrue; profile initializes as `pending_verification`.
  2. Transactional RPC provisions organization, profile, role, access parameters, and audit event.
  3. Course entitlements are excluded from generic invitation because `public.course_entitlements`
     requires a specific `course_id`; course/cohort assignment remains a separate administrative workflow.
  4. When recipient confirms invitation email, trigger `on_auth_user_confirmed` on `auth.users`
     automatically transitions the organization-assigned profile from `pending_verification` to `active`.
  5. Recipient logs in and `RequireAccountAccess` admits them to the application shell.
- Invitation redirect and callback architecture (Phase 6.5.2B1.6, B1.7, & B1.8):
  1. GoTrue limitation: Supabase `auth.admin.inviteUserByEmail()` is not PKCE-capable. Its default
     invitation verification endpoint issues an implicit redirect appending `#access_token=...`
     to the configured `redirectTo`. Under HashRouter, this yields double fragments
     (`/#/auth/callback#access_token=...`), and the PKCE-configured GoTrue client throws
     `AuthPKCEGrantCodeExchangeError: Not a valid PKCE flow url`.
  2. TokenHash contract: Invitations use an explicit TokenHash verification link:
     `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`.
     Placing `token_hash` in the hash fragment ensures the one-time token is not transmitted to GitHub
     Pages in HTTP requests.
  3. Repository email template: `supabase/templates/invite.html` provides the canonical invitation
     email, configured locally in `supabase/config.toml` under `[auth.email.template.invite]`.
     It builds the destination link using `{{ .RedirectTo }}` (the value passed to `inviteUserByEmail`),
     ensuring that the Edge Function's environment-controlled base URL governs the invite link.
     *Prerequisites for Phase 6.5.2B2A*:
     - **Hosted Email Template**: Before sending remote invitations in B2B, the hosted Supabase
       Auth "Invite User" email template must be configured to match this repository template.
     - **Hosted Redirect URL Allowlist**: The hosted Supabase Auth Redirect URL allowlist must explicitly
       permit the exact production base URL passed as `redirectTo`, expected:
       `https://dr-afif.github.io/bls/`. Do not assume it is already allowed; verify explicitly during B2A.
  4. Base URL redirect contract: `admin-invite-user` passes `redirectTo = `${normalizedBase}/`` derived
     from required runtime environment variable `SITE_URL`. GoTrue exposes this passed argument to the
     email template via `{{ .RedirectTo }}` (distinct from the project-level `{{ .SiteURL }}` setting).
     Option A `SITE_URL` enforcement fails closed with 500 `CONFIGURATION_ERROR` if absent or empty.
  5. Browser-side verification: In `AuthCallbackPage`, detecting `token_hash` and `type=invite` invokes
     `supabase.auth.verifyOtp({ token_hash, type: "invite" })` through `useAuth().verifyOtp`.
     Arbitrary or unexpected types fail closed without calling `verifyOtp`.
  6. URL and history hygiene: Once `verifyOtp` succeeds or fails, `cleanTokenFromUrl()` purges `token_hash`
     and `type` from the address bar via `history.replaceState`, avoiding token retention in history or logs.
  7. Dual-flow separation: Password recovery retains its standard PKCE flow (`?code=...#/auth/callback`),
     while invitation acceptance runs the TokenHash `verifyOtp` branch.
  8. Credential setup: Once the invitation session is verified, `AuthCallbackPage` navigates to
     `/auth/reset-password` (`replace: true`), where the user creates their initial password.
     Both the `RequireAuthentication` route guard and `ResetPasswordPage` component guards prevent
     unauthenticated visitors from submitting password updates.
- Safe partial-failure compensation: newly created Auth users are deleted via `auth.admin.deleteUser`
  if the provisioning RPC fails. If compensation fails, `PROVISIONING_ROLLBACK_FAILED` is returned.
  Existing users (`USER_ALREADY_EXISTS`) are never deleted.
- Note: Phase 6.5.2B1.8 is local-only; hosted function deployment, linked migration verification, hosted redirect allowlist verification, and hosted email template update remain pending in Phase 6.5.2B2A.
