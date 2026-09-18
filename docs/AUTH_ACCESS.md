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

### Controlled cohort roster invitation (Milestone 7)

Implemented default for learners. Public self-registration is not exposed.

1. **Roster Staging (Intent Only)**: Authorized staff (assigned instructor or administrator) enters the learner's email address into `public.cohort_learner_roster`. No names, passwords, or I.C. numbers are required up front. Staging records intended participation only and grants no access.
2. **Invitation Dispatch**:
   - **Existing Active User**: Sending an invitation immediately activates or restores `public.cohort_members` and creates/synchronizes `public.course_entitlements` for all attached cohort courses. The existing learner does not need to open the email to access the cohort if signing in directly. A bilingual notification email is delivered containing cohort details (resolving any course schedule overrides) and a one-time return link.
   - **New Learner**: Creates an `access_invitations` attempt record referencing the `cohort_roster_entry_id` with 7-day validity. A bilingual invitation email is dispatched.
3. **Intermediary Scanner Defense**: The recipient opens an intermediary landing page displaying cohort details. An explicit human action ("Accept Invitation" for new learners, "Open Cohort" for existing learners) is required to proceed, protecting against premature token consumption by automated corporate email security scanners.
4. **First-Time Learner Registration**: The new learner completes the registration form (Full Name, National Identity Card / I.C. number [MyKad 12 digits or Passport], Preferred Language `en` or `ms`, and Password). Upon atomic submission via `complete_learner_registration`:
   - Account status transitions to `active`.
   - Identity is validated, normalized, and stored in `private.learner_identities`.
   - Duplicate identities fail safely with generic messaging to prevent enumeration.
   - Cohort memberships and multi-course entitlements are activated.
5. **Existing Learner Passwordless Return**: When an existing active user clicks "Open Cohort" on the intermediary page:
   - Server validates the 7-day invitation token and verifies the email matches the existing account.
   - Server requests a fresh short-lived Supabase Auth token (via `auth.admin.generateLink`).
   - The browser exchanges the token via `supabase.auth.verifyOtp` to establish an authenticated session.
   - The user enters the application directly without re-entering their old password; their existing password is NOT changed.

### Staff bootstrap authorization intent

Authorized staff onboarding follows the strict role hierarchy backed by `public.staff_access_entries`:
- `super_admin`: May stage `admin` and `instructor` roles in `public.staff_access_entries`; manages organization staff.
- `admin`: May stage `instructor` roles only; manages cohort assignments.
- `instructor`: May stage learner emails strictly to cohorts where actively assigned; cannot stage or invite staff.
- Super administrator roles cannot be created through the application UI.
- Removing staff intent transitions status to `removed` and never deletes an established user account.
- Individual invitation attempts are recorded in `public.access_invitations` referencing `staff_access_entry_id`.
- Dispatch of dynamic bilingual staff emails is governed by the server-side Email Transport Spike (Phase 7.3).

### Open signup and registration codes (Deferred)

Public self-registration and self-service registration codes remain deferred.

## Account states

- `pending_verification`: Auth identity created; awaiting email confirmation or invitation token validation.
- `pending_registration`: Email confirmed; awaiting learner first-time profile completion (full name, I.C., language, password).
- `pending_approval`: Optional queue for unassigned signups.
- `active`: Fully registered and entitled account.
- `suspended`: Globally suspended by administrator (denies application shell and API access).
- `expired`: Account access duration has ended.
- `archived`: Historical account retired from operational use.

## Roles & Authorization Hierarchy

### Learner

- View own profile and own National Identity (I.C.) details.
- View entitled courses across assigned active cohorts where `learner_access_state = 'open'`.
- View permitted practical guides and supporting media.
- Start eligible pre- and post-tests and autosave answers.
- View own permitted quiz results and historical attempts.
- Cannot view other learners' data or access administrative or instructor routes.

### Instructor

- Learner permissions for own access.
- View assigned cohorts and cohort teaching context.
- Access Teaching Kit materials by topic and teaching stage.
- Add and import learner emails to assigned cohort rosters (`public.cohort_learner_roster`).
- Send and resend invitations for assigned cohorts.
- View assigned cohort learners' attendance and completion status with **SERVER-DERIVED MASKED I.C. ONLY** (`******-**-1234`).
- Release post-tests for assigned cohorts.
- Cannot view or manage unassigned cohorts, self-assign cohorts, or grant staff roles.
- Strictly denied direct SELECT access to `private.learner_identities`. Full I.C. numbers never appear in instructor network payloads.

### Administrator

- All instructor permissions across organization scope.
- Manage users, cohorts, courses, resources, questions, and quizzes.
- Assign instructors to cohorts.
- View full National Identity (I.C.) numbers for learners in their organization strictly via authorized RPC (`get_learner_identity_for_admin`) when operationally required.
- Toggle reversible cohort learner access (`open` / `closed`).
- Stage instructors via `public.staff_access_entries` and manage staff access.
- Export operational reports and view organization audit logs.
- Cannot invite `admin` or `super_admin` roles.

### Super administrator

- All administrator permissions across all organizations.
- Stage administrators and instructors via `public.staff_access_entries`.
- Manage system-wide settings, storage buckets, and high-impact data operations.
- Only role permitted to stage or manage administrators.


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
2. Account status is `active` (not `pending_verification`, `pending_registration`, or `suspended`).
3. Course exists and is published.
4. Entitlement belongs to the user.
5. Entitlement is not revoked.
6. Start time has been reached.
7. Expiry time has not passed.
8. Resource or quiz publication window is valid.
9. Prerequisites are complete where required.
10. If the entitlement is associated with a cohort, the cohort's `learner_access_state` must be `'open'`.

## National Identity (I.C.) Privacy Boundary (Milestone 7)

Malaysian National Identity Card (MyKad / I.C.) numbers are sensitive personal data under privacy standards.

- **Private Schema Boundary**: I.C. records are physically segregated in `private.learner_identities` rather than `public.profiles` or any publicly accessible table. Direct SELECT privilege is DENIED to all browser roles (`anon`, `authenticated`).
- **Controlled Access RPCs (`SECURITY DEFINER`, `SET search_path = ''`)**:
  - `get_my_learner_identity()`: Allows an authenticated learner to inspect their own identity record.
  - `update_my_learner_identity(id_type, id_number)`: Allows a learner to establish/update their identity during registration with strict format validation.
  - `get_learner_identity_for_admin(target_user_id)`: Permits administrators and super-administrators to retrieve full identity records strictly within their authorized organization scope.
  - `get_cohort_roster_for_instructor(target_cohort_id)`: Provides assigned instructors with a cohort roster projection containing only server-derived masked identifiers.
- **Server-Derived Masking**:
  - Masked values are derived dynamically on the server (`'******-**-' || right(id_number, 4)` for MyKad) rather than stored in a second mutable column.
  - Full I.C. numbers are never transmitted in instructor network responses, client state, or generic profile queries.
- **Identity Formats & Normalization**:
  - `mykad`: Normalized strictly to 12 digits (`^\d{12}$`), stripping all hyphens and whitespace.
  - `passport`: Normalized to trimmed uppercase alphanumeric (`^[A-Z0-9-]{6,20}$`).
  - Table constraint `UNIQUE (id_type, id_number)` prevents duplicate learner identities.
  - Duplicate registration fails safely with generic error messaging ("The identification provided is already associated with an account. Please sign in or contact an administrator.") to prevent identity enumeration.
- **Audit & Log Hygiene**:
  - Full I.C. values must NEVER appear in `audit_events.metadata`, browser console logs, server error messages, or network diagnostics.
  - Identity update audit events record only actor, target user ID, timestamp, and entity type (`learner_identity`).

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
     *Prerequisites and Verification Status (Phase 6.5.2B2A)*:
     - **Hosted Site URL & Redirect URL Allowlist**: Confirmed remotely aligned. Hosted Site URL is `https://dr-afif.github.io/bls/`, and Redirect URLs include `https://dr-afif.github.io/bls/**`, `http://localhost:5173/**`, and `http://127.0.0.1:5173/**`.
     - **Hosted Email Template**: Requires manual update in Supabase Dashboard (Authentication → Email Templates → Invite user) to match `supabase/templates/invite.html` using action URL `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite` before Phase 6.5.2B2B invitations.
     - **Edge Function SITE_URL**: Requires manual configuration in Supabase Dashboard (Project Settings → Edge Functions → Secrets) setting `SITE_URL=https://dr-afif.github.io/bls/`.
     - **Leaked-Password Protection**: Requires manual enablement in Supabase Dashboard (Authentication → Password → Check for leaked passwords).
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
- Hosted Infrastructure Deployment & Verification (Phase 6.5.2B2A):
  - Database Migration: 20260820090000 applied cleanly to linked Supabase project; 28/28 migrations aligned.
  - Linked pgTAP Regression: 13 files and 358 assertions passing remotely (100% green).
  - Isolated pgTAP: 30/30 assertions passing for `user_provisioning_transaction_test.sql`.
  - Database Types: Regenerated `src/lib/supabase/database.types.ts` from linked schema.
  - Edge Function: `admin-invite-user` deployed remotely with `verify_jwt: true` (version 2, ACTIVE).
  - Security Attributes: Anonymous requests rejected at JWT gateway (HTTP 401 `UNAUTHORIZED_NO_AUTH_HEADER`); direct PostgREST calls to `provision_invited_user` rejected with HTTP 401 / 42501 for anon and authenticated.
- Production Invitation Verification (Phase 6.5.2B2B) — COMPLETE:
  - Custom SMTP: Enabled using dedicated production Gmail infrastructure (`smtp.gmail.com:465`, sender `BLS Course Companion`).
  - Hosted Template: Configured with `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`. The default `.ConfirmationURL` flow must not be restored.
  - Invitation Callback: Verified `#/auth/callback?token_hash=...&type=invite` accepts the invitation without exposing `#access_token=...` or `refresh_token=...` in the browser URL.
  - Account Lifecycle: Account successfully transitioned from `pending_verification` to `active` upon TokenHash OTP verification.
  - Initial Password Setup: Authenticated participant successfully established strong password via `/auth/reset-password`.
  - Authentication Journey: Full lifecycle verified: invitation acceptance -> password setup -> authenticated shell -> logout -> email/password login -> authenticated shell.
  - Role & Course Scope: Verified account holds strictly the `learner` role. Generic administrator invitations do not automatically grant course entitlements or cohort memberships; course/cohort access remains independently governed.
  - Incident Containment: An initial test with an unconfigured default template resulted in an implicit token redirect; access was immediately neutralized by suspending the profile, revoking all sessions, performing clean deletion via Auth Admin API preserving historical audit events, and cleanly re-inviting with custom SMTP and TokenHash template.
  - Test Account State: Controlled test account (`m***@upm.edu.my`) is retained in `active` state with verified learner authorization.
