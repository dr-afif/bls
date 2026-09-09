# Security Model

## Security objectives

- Protect learner identity and educational records.
- Prevent unauthorized access to courses and resources.
- Prevent learners from altering scores or access.
- Prevent exposure of correct answers before permitted review.
- Protect administrative operations.
- Maintain auditability.
- Minimize sensitive data in the browser.
- Avoid caching protected content.

## Core controls

1. Supabase Auth
2. PostgreSQL Row Level Security
3. Database constraints
4. Controlled RPC functions
5. Private Storage buckets
6. Short-lived resource access
7. Supabase Edge Functions for privileged operations
8. Append-only audit events
9. Rate limiting
10. Secure deployment and secret handling

## Key rules

- Never place a service-role or secret key in the frontend.
- Never trust hidden buttons as authorization.
- Never trust client-calculated quiz scores.
- Never let learners select correct-answer fields.
- Never make protected PDF buckets public.
- Never cache signed URLs or protected documents.
- Never allow ordinary administrators to edit audit history.
- Never destructively alter historical attempt data.

## Row Level Security

Enable RLS on every browser-accessible table.

### Learners

May:

- Read own profile
- Update approved own fields
- Read published entitled courses
- Read published entitled resources
- Read and write own progress through allowed operations
- Read own permitted attempts and results

May not:

- Read other users
- Read correct-answer fields
- Insert final scores
- Change role
- Change entitlement
- Grant completion
- Access unpublished content
- Read audit records

### Instructors

May:

- Read assigned cohorts
- Read progress and results for assigned learners
- Perform only explicitly granted educational actions

### Administrators

May:

- Manage data within organization or assigned scope
- Use privileged functions for sensitive operations
- View scoped audit and analytics data

### Super administrators

May:

- Perform system-wide administration
- Manage administrator roles
- Access global reporting
- Execute high-impact functions

## Security-definer functions

Only use when needed.

Requirements:

- Fixed `search_path`
- Minimal privileges
- Strict argument validation
- Explicit authorization inside function
- Restricted execute grants
- No dynamic SQL unless unavoidable and safely parameterized
- Audit sensitive actions
- Idempotency for retryable operations

## Storage security

- PDFs stored in a private bucket
- File paths should not disclose unnecessary user information
- Access issued only after entitlement validation
- Signed access should be short-lived
- Upload MIME type and size must be validated
- Uploaded PDFs should be scanned or validated before publication
- Old versions should be retained or archived according to policy

Milestone 4 Phase 2 implements this boundary for fictional PDFs in the private
`course-resources` bucket. Browser roles have no object read, list, update, or
delete policy. Administrator insert access is limited to the exact recorded
path of a same-organization draft PDF version. A JWT-protected Edge Function
calls service-only database authorization, signs the returned path for 60
seconds, and records authorization and issuance events without persisting the
URL or token. Per-user rate limiting and idempotent request IDs reduce abuse
and retry duplication.

Watermark rendering, viewer controls, protected-content cache inspection, and
document malware scanning remain later integration and production-hardening
requirements.

## User provisioning and account lifecycle security

Milestone 6 Phase 6.5.2B1 / B1.5 / B1.6 establishes the server-side administrator provisioning boundary:

- **Isolated Service-Role Operations**: All Supabase Auth Admin actions and privileged database writes are strictly isolated within the trusted `admin-invite-user` Edge Function runtime. The browser client receives only the public publishable key and standard user JWT.
- **Fail-Closed Caller Authorization**: The Edge Function independently parses caller claims from the platform JWT, verifies active account status, and confirms administrative privilege (`admin` or `super_admin`) within the organization. Non-admin users and cross-organization requests fail closed.
- **Role Escalation Protection**: Organization administrators may only provision `learner` or `instructor` accounts. Administrative role creation (`admin` or `super_admin`) is blocked server-side.
- **Strictly Create-Only Provisioning & Target Takeover Prevention (Phase 6.5.2B1.6)**:
  - Exclusive row locking: `provision_invited_user` locks the target profile using `SELECT ... FOR UPDATE` before applying mutations.
  - Target invariant enforcement: requires `organization_id IS NULL`, `account_status = 'pending_verification'`, and 0 existing assigned roles in `public.user_roles`.
  - Established users, existing organization members, and active, suspended, or expired accounts are rejected with error `42501` to prevent target user takeover.
  - Elimination of destructive role replacement: `DELETE FROM public.user_roles` is removed. Provisioning proves zero roles exist and inserts exactly one permitted initial role.
  - Concurrency safety: competing concurrent provisioning attempts on the same profile are serialized by the row lock; the second caller encounters the mutated state, fails invariant checks, and aborts cleanly.
- **Transactional Database Provisioning**: Database operations (organization assignment, profile naming, role assignment, and audit event recording) occur inside a single PostgreSQL transaction via `public.provision_invited_user`, callable exclusively by `service_role`.
- **Course Entitlement Separation**: Course entitlements require a specific `course_id` and are not created during generic user invitation. Course/cohort assignment remains a distinct administrative workflow.
- **Account Status Lifecycle & Email Confirmation Trigger**:
  1. Invited users initialize as `pending_verification`.
  2. When the user accepts the invitation link, GoTrue updates `auth.users.email_confirmed_at`.
  3. The `on_auth_user_confirmed` trigger automatically transitions organization-assigned profiles from `pending_verification` to `active`.
  4. On first login, `RequireAccountAccess` verifies `active` status and admits the user.
- **Safe Compensation & Rollback**: If the single transactional provisioning RPC fails, the database automatically rolls back all mutations, and the Edge Function attempts compensating deletion of the newly created Auth user via `auth.admin.deleteUser`. If compensation deletion fails, the function returns `PROVISIONING_ROLLBACK_FAILED` and logs diagnostic error details without exposing secrets. Pre-existing accounts (`USER_ALREADY_EXISTS`) are never deleted.
- **Append-Only Auditing**: Every successful invitation creates an immutable event in `public.audit_events` with actor user ID, target user ID, organization ID, and role/access metadata, with zero disclosure of secrets, passwords, or invite tokens.
- **Targeted Window-Focus Hardening**: The frontend `useAccountAccess` query specifies `refetchOnWindowFocus: "always"`. Returning to a background tab immediately checks account status and roles against PostgreSQL RLS, promptly reflecting suspensions or revocations without relying on client-side state alone.
- **PKCE-Compatible TokenHash Invitation Acceptance (Phases 6.5.2B1.7 & B1.8)**:
  - Default GoTrue invitation redirects append session credentials in an implicit fragment (`#access_token=...`), incompatible with React Router HashRouter and rejected by PKCE-configured GoTrue clients (`AuthPKCEGrantCodeExchangeError`).
  - Invitations use a TokenHash contract: `{{ .RedirectTo }}#/auth/callback?token_hash={{ .TokenHash }}&type=invite`.
  - The Edge Function passes trusted base URL `${normalizedBase}/` (derived from required runtime variable `SITE_URL`) as `redirectTo` to `inviteUserByEmail`, which GoTrue passes to the template as `{{ .RedirectTo }}` (distinct from project-level `{{ .SiteURL }}`).
  - Fragment placement ensures the one-time token hash is never sent to GitHub Pages web servers in HTTP requests.
  - Strict type guard: `AuthCallbackPage` mandates `type === "invite"` before invoking `supabase.auth.verifyOtp`; arbitrary or unexpected OTP types fail closed without executing verification.
  - History & address-bar hygiene: Immediately upon verification or terminal failure, `cleanTokenFromUrl()` purges `token_hash` and `type` from the URL via `history.replaceState`, ensuring tokens are never retained in browser history or exposed to analytics/logging.
  - Mechanism isolation: Password recovery retains standard PKCE callback processing (`?code=...#/auth/callback`), kept strictly isolated from the TokenHash invitation pathway.
  - Password setup authorization guard: `/auth/reset-password` is guarded by both `RequireAuthentication` (route guard) and `ResetPasswordPage` component state checks (`state.status === "signed_in"` required; signed-out visitors redirect to `/auth/login` and submit button remains disabled).

## Quiz security

- Correct options excluded from learner-selectable queries
- Question assignment performed server-side
- Question versions frozen per attempt
- Time limit checked server-side
- Attempt count checked server-side
- Submission idempotent
- Final score stored only by trusted logic
- Post-submission answers immutable
- Review policy enforced before answer reveal

## Frontend security

- Content Security Policy
- Strict TypeScript
- Escaped output
- Avoid unsafe HTML
- Validate URLs
- Use official YouTube embed URLs
- Do not expose stack traces to learners
- Do not log tokens or private URLs
- Avoid storing sensitive reports in persistent browser storage

## Rate limiting

Apply to:

- Signup
- Login-related custom endpoints
- Invitation acceptance
- Resource-token issuance
- Quiz start
- Quiz autosave
- Quiz submission
- Report generation
- Certificate generation
- Bulk imports

## Audit events

Audit:

- User approval
- Role change
- Access grant
- Access extension
- Access revocation
- Account suspension
- Resource upload
- Resource replacement
- Course publication
- Question modification
- Quiz publication
- Attempt reset or invalidation
- Report export
- Certificate issuance

## Privacy

Define:

- Retention period for event-level analytics
- Retention period for IP or device metadata
- Who may view individual results
- Account deletion process
- Data-export process
- Certificate-retention policy
- Audit-retention policy

## Threat examples

### Learner changes frontend role value

Mitigation: backend RLS and server checks ignore client-side role state.

### Learner calls quiz table directly

Mitigation: RLS denies correct-answer fields and controlled RPC handles attempt creation.

### Learner edits score request

Mitigation: score is calculated and stored server-side.

### Shared PDF signed URL

Mitigation: short expiry, dynamic watermarking, entitlement check, and audit logging.

### Administrator from another organization searches users

Mitigation: organization-scoped policies and trusted function authorization.

### Cached protected content survives logout

Mitigation: protected resources are excluded from service-worker and application caches.

## Security testing

Required tests include:

- Anonymous access denied
- Learner cross-user reads denied
- Learner role changes denied
- Learner entitlement changes denied
- Learner score changes denied
- Correct-answer reads denied
- Expired entitlement denied
- Revoked entitlement denied
- Instructor scope enforced
- Administrator organization scope enforced
- Service function permission checks
