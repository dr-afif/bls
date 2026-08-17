# Acceptance Tests

## Authentication

### AT-AUTH-001 — Invite acceptance

Given a valid invitation, when the user completes the acceptance flow, then the account is created or activated and the user can complete the profile.

### AT-AUTH-002 — Invalid invitation

Given an expired or invalid invitation, when the user opens it, then the application explains that the invitation cannot be used and no access is granted.

### AT-AUTH-003 — Password reset

Given a registered user, when the user completes the reset flow, then the new password allows login and the previous password no longer works.

### AT-AUTH-004 — Suspended account

Given a suspended account, when the user signs in, then protected learner and admin routes are denied.

## Entitlement

### AT-ACCESS-001 — Permanent access

Given permanent course entitlement, when the learner opens the course, then access is permitted without an expiry date.

### AT-ACCESS-002 — Fixed-window access before start

Given a future start date, when the learner opens the course before that date, then access is denied with the correct future start information.

### AT-ACCESS-003 — Fixed-window access after expiry

Given an expired entitlement, when the learner opens a resource, then access is denied.

### AT-ACCESS-004 — Duration from activation

Given a duration entitlement with no activation date, when the learner first opens the course, then activation and expiry are calculated server-side.

### AT-ACCESS-005 — Revocation

Given an otherwise valid entitlement that is revoked, when the learner opens a protected action, then access is denied immediately.

## Resources

### AT-RES-001 — Published resource

Given active entitlement and a published resource, when the learner opens it, then the resource is displayed.

### AT-RES-002 — Unpublished resource

Given active entitlement but an unpublished resource, when the learner requests it directly, then access is denied.

### AT-RES-003 — PDF privacy

Given a protected PDF, when an anonymous user requests the storage path, then the file is not accessible.

### AT-RES-004 — Temporary PDF access

Given active entitlement, when the learner opens a PDF, then temporary access is issued and the viewer opens without a permanent public URL.

### AT-RES-005 — PDF viewer controls

Given an open PDF, then the standard application interface does not provide download, save, print, or open-original controls.

### AT-RES-006 — Video completion

Given a required video, when the learner skips directly to the end without meeting the watched threshold, then the resource is not marked complete.

### AT-RES-007 — Resource prerequisite

Given a locked resource with incomplete prerequisite, when the learner requests it directly, then access is denied.

## Quiz

### AT-QUIZ-001 — Eligibility

Given an active entitled learner but no authorized post-test release for the
learner's cohort, when the learner starts the post-test, then the backend
denies the attempt without relying on resource-completion state.

### AT-QUIZ-002 — Attempt creation

Given an eligible learner, when the learner starts the quiz, then the backend creates an attempt with frozen question versions.

### AT-QUIZ-003 — Correct answers hidden

Given an active attempt, when the learner inspects the returned payload, then correct-answer fields are absent.

### AT-QUIZ-004 — Autosave

Given an active attempt, when the learner selects an answer, then the response is saved and the interface confirms the save state.

### AT-QUIZ-005 — Server timer

Given an expired attempt, when the learner changes the client clock and submits, then the backend still treats the attempt as expired.

### AT-QUIZ-006 — Server-side score

Given submitted answers, when the attempt is finalized, then the backend calculates and stores the score.

### AT-QUIZ-007 — Immutable result

Given a submitted attempt, when the learner tries to change an answer or score, then the change is rejected.

### AT-QUIZ-008 — Idempotent submission

Given a submitted attempt, when the same submission is retried, then no duplicate final result is created.

### AT-QUIZ-009 — Attempt limit

Given the maximum number of attempts reached, when the learner starts another attempt, then the backend denies it.

### AT-QUIZ-010 — Review policy

Given a quiz configured to hide correct answers, when results are shown, then correct answers and explanations remain hidden.

## Administration

### AT-ADMIN-001 — Learner denied admin route

Given a learner, when the learner opens an admin URL, then the route is denied and backend data remains inaccessible.

### AT-ADMIN-002 — Invite user

Given an administrator, when a valid invitation is created, then the user receives the configured invitation and an audit event is recorded.

### AT-ADMIN-003 — Grant fixed access

Given an administrator, when fixed start and expiry dates are submitted, then the entitlement is stored and shown correctly.

### AT-ADMIN-004 — Extend access

Given an existing entitlement, when an administrator extends it, then the new expiry is enforced and the change is audited.

### AT-ADMIN-005 — Cross-organization denial

Given an organization administrator, when the administrator requests a user outside the organization, then access is denied.

### AT-ADMIN-006 — Question versioning

Given a published question used in an attempt, when an administrator edits it, then a new version is created and the historical attempt remains unchanged.

### AT-ADMIN-007 — Resource versioning

Given a published PDF used by learners, when an administrator replaces it, then a new version is created and historical progress retains the old version reference.

## Analytics

### AT-AN-001 — Learning gain

Given a valid pre-test and post-test, when analytics are generated, then learning gain equals post-test percentage minus pre-test percentage.

### AT-AN-002 — Scoped analytics

Given an instructor assigned to one cohort, when analytics are opened, then only that cohort is included.

### AT-AN-003 — Invalidated attempt

Given an invalidated attempt, when pass-rate analytics are calculated, then the attempt is excluded according to policy.

## PWA

### AT-PWA-001 — Installability

Given a supported browser, when the manifest and service worker are available, then the application is installable.

### AT-PWA-002 — Offline shell

Given a previously loaded app shell and no network, when the app opens, then an offline-safe shell and clear offline state appear.

### AT-PWA-003 — Protected resource offline

Given no network, when the learner opens a protected PDF, then the resource does not load from cache.

### AT-PWA-004 — Update during quiz

Given an active quiz and a new service worker, then the application does not force-refresh before quiz submission.

## Accessibility

### AT-A11Y-001 — Keyboard quiz

Given a quiz question, when using keyboard only, then the learner can select, navigate, review, and submit.

### AT-A11Y-002 — Focus restoration

Given an opened dialog, when it closes, then focus returns to the invoking control.

### AT-A11Y-003 — Error association

Given an invalid form, when validation fails, then each error is programmatically associated with its field.

### AT-A11Y-004 — Non-colour status

Given pass, fail, warning, and completion states, then each state includes text or icon meaning beyond colour alone.
