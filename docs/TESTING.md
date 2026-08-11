# Testing Strategy

## Test layers

1. Static analysis
2. Unit tests
3. Component tests
4. Database tests
5. Integration tests
6. End-to-end tests
7. Accessibility tests
8. Security tests
9. Performance tests
10. Manual clinical-content review

## Static analysis

- TypeScript strict mode
- Linting
- Formatting checks
- Dependency audit
- Secret scanning
- Build verification

## Unit tests

Test:

- Access-expiry calculations
- Eligibility calculations
- Quiz percentage calculation
- Pass or fail decisions
- Resource-progress calculation
- Video watched-range merging
- PDF page-progress calculation
- Validation schemas
- Analytics formulas
- Data transformations

## Component tests

Test:

- Login form
- Signup form
- Password reset
- Course card states
- Resource list states
- Question selection
- Autosave state
- Quiz timer warnings
- Submit confirmation
- Access editor
- Resource editor
- Error and empty states
- Mobile navigation

## Database tests

Test:

- Anonymous access denied
- Learner can read own profile
- Learner cannot read other profile
- Learner cannot grant role
- Learner cannot grant entitlement
- Learner cannot alter final score
- Learner cannot read correct answers
- Expired entitlement denied
- Revoked entitlement denied
- Instructor cohort scope
- Administrator organization scope
- Audit records append-only
- Historical attempts immutable
- Quiz submission idempotent

## End-to-end tests

### Learner

- Accept invitation
- Verify account
- Sign in
- Complete profile
- Open dashboard
- Start pre-test
- Autosave answer
- Submit pre-test
- Open video
- Reach completion threshold
- Open PDF
- Reach reading threshold
- Become eligible for post-test
- Submit passing post-test
- View result
- View certificate eligibility

### Access

- Expired learner denied resource
- Revoked learner denied quiz
- Suspended account denied app access
- Grace-period user can view results but not resources

### Administrator

- Invite user
- Approve user
- Grant fixed-window access
- Extend access
- Revoke access
- Create course
- Add section
- Add video
- Upload PDF
- Create question
- Publish quiz
- View analytics
- Export report
- Review audit event

## Accessibility tests

- Axe or equivalent automated scan
- Keyboard navigation
- Focus order
- Dialog focus trap
- Screen-reader labels
- Zoom to 200 percent
- Mobile reflow
- Reduced motion
- Colour contrast
- Error announcement
- Quiz timer announcement

## Security tests

- Direct API calls without session
- Tampered role in client state
- Tampered user identifier
- Tampered course identifier
- Tampered score payload
- Reused signed resource URL
- Repeated submission
- Expired attempt submission
- Cross-organization admin access
- Correct-answer query attempt
- Protected-resource cache inspection

## Performance tests

Measure:

- Initial application-shell load
- Dashboard query count
- Course page query count
- Admin table pagination
- PDF viewer load
- Quiz autosave latency
- Quiz submission latency
- Analytics query duration

## Test data

Use fictional fixtures only.

Include:

- Active learner
- Expired learner
- Suspended learner
- Instructor
- Organization administrator
- Super administrator
- Course with complete resources
- Course with missing resource
- Published quiz
- Closed quiz
- Passing attempt
- Failing attempt
- Timed-out attempt

## CI gates

Before merge:

- Typecheck
- Lint
- Unit tests
- Component tests
- Production build
- Database migration validation
- Selected SQL/RLS tests
- Selected Playwright smoke tests
