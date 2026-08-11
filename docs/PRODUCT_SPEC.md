# Product Specification

> `PRODUCT_DIRECTION.md` is the canonical brief. Long-term production controls
> in this specification remain valid only where they support the in-person
> course-companion model.

## Product name

Working name: **BLS Learning PWA**

## Product vision

Provide a reliable, accessible, and auditable companion application for
physical Basic Life Support courses.

Learners use it to view cohort information, open practical references, complete
pre- and post-tests, and review results. Instructors use it as a dependable
teaching toolkit. Administrators manage people, cohorts, resources, quizzes,
results, exports, access, and audit records.

The system does not deliver self-paced online modules or replace the physical
course.

## Target users

### Learner

A healthcare worker, student, trainee, or other authorized participant
attending an in-person BLS course.

### Instructor

A trainer or educator who delivers the physical course and needs rapid access
to teaching materials and permitted cohort context.

### Administrator

A course or organization administrator who manages learners, resources, quizzes, cohorts, and reports.

## Core problems

- Learners need course logistics, practical guides, supporting resources, and
  required quizzes in one clear companion application.
- Instructors need dependable teaching materials within one or two taps.
- Administrators need efficient people, cohort, content, quiz, and results
  workflows.
- Learner access may be permanent or time-limited.
- Pre- and post-tests need secure scoring and historical traceability.
- Administrators need visibility into cohort readiness and assessment outcomes.
- Protected resources should not be directly downloadable through normal application controls.
- The system must work well on both mobile and desktop.
- Course and question content must support clinical review and version history.

## Product goals

1. Make physical-course information and the next required action obvious.
2. Support secure identity and access control.
3. Restrict course resources to authorized users.
4. Put frequently used guides and teaching materials within one or two taps.
5. Support baseline and post-learning comparisons.
6. Provide manageable administrative workflows.
7. Maintain historical accuracy when content changes.
8. Meet a high accessibility standard.
9. Remain deployable with GitHub Pages and Supabase.
10. Keep future migration to another static host or video provider possible.

## Product non-goals

- Self-paced online modules or an LMS learning pathway
- Resource-completion gates used as a substitute for physical attendance
- Gamification, streaks, badges, or leaderboards
- Replacing instructor-led practical skills teaching
- Certificates in the initial MVP

## Non-goals for the first release

- Native iOS or Android applications
- Fully offline protected resources
- Real-time classes or video conferencing
- Social feeds
- Public course marketplace
- Billing and subscription management
- SCORM compliance
- Complex AI-generated marking
- High-stakes remote invigilation
- Absolute prevention of screenshots or screen recording

## Learner course-companion journey

```text
Invitation or signup
  ↓
Email verification and profile completion
  ↓
Account approval or code validation
  ↓
Home and cohort details
  ↓
Preparation guidance and practical references
  ↓
Pre-test
  ↓
Attend physical BLS course
  ↓
Post-test released
  ↓
Post-test
  ↓
View result
```

## Functional modules

### Authentication and onboarding

- Email and password signup
- Invite-only registration
- Optional registration codes
- Email verification
- Login and logout
- Password reset
- Profile completion
- Terms acceptance
- Account-status handling

### Learner home and guides

- Current or upcoming cohort
- Course date, time, venue, instructor, and preparation notes
- Quick access to frequently used guides
- Searchable practical guides, documents, checklists, and supporting videos
- Pre-test and post-test availability
- Access and account-status information

### Instructor teaching toolkit

- Next teaching session
- Materials grouped by teaching stage or BLS topic
- Lecture and demonstration videos
- Teaching guides and checklists
- Search and recent materials
- Relevant assigned-cohort context

### Cohorts

- Physical-course dates, times, venues, and notes
- Learner and instructor membership
- Permitted readiness or quiz-completion summaries
- Upcoming, past, and attention-required states

### Quiz module

- Pre-test
- Post-test
- Single-best-answer questions
- Multiple-response questions
- True or false
- Ordered sequence
- Image-based questions
- Time limits
- Attempt limits
- Server-side scoring
- Configurable answer review

### Admin module

- User search and filtering
- Invite and approve users
- Suspend and reactivate users
- Role assignment
- Cohorts
- Cohort scheduling and membership assignment
- Resource management
- Question bank
- Quiz builder
- Analytics
- Reports
- Audit logs
- Settings

## Access models

The system must support:

1. Permanent access
2. Fixed start and expiry dates
3. Duration from first course activation
4. Revoked access
5. Optional grace-period behaviour

Access checks must be performed server-side for each protected action.

## Course and cohort configuration

A physical-course offering or cohort may configure:

- Whether a pre-test is required
- Course date, time, venue, instructor, and preparation notes
- Which learner guides and instructor materials are published
- When and how the pre-test becomes available
- When and how the post-test becomes available
- Passing score
- Attempt limit
- Result visibility
- Answer and explanation visibility

Resources are not sequenced as learner modules and do not form a
completion-based learning pathway.

## User and account states

Suggested account states:

- `pending_verification`
- `pending_approval`
- `active`
- `suspended`
- `expired`
- `archived`

Account status and course entitlement are separate concepts.

## Resource statuses

- `draft`
- `under_review`
- `approved`
- `published`
- `retired`
- `archived`

## Quiz statuses

- `draft`
- `under_review`
- `published`
- `closed`
- `retired`

## Clinical governance

Each clinical resource and question should support:

- Author
- Reviewer
- Guideline or source
- Guideline edition or year
- Approval state
- Review date
- Next review date
- Version history

Published content used in historical attempts must not be destructively overwritten.

## Success metrics

- Registration-to-cohort-readiness rate
- Pre-test completion before the physical course
- Pre- to post-test improvement
- Post-test pass rate
- Time needed to find and open a guide or teaching material
- Successful instructor resource launches during teaching
- Cohorts with complete schedule, instructor, and membership data
- Expired-access rate
- Support-request rate
- Accessibility defect count
- Quiz item quality

## MVP

The first useful MVP includes:

- Invite-only accounts
- Learner, instructor, and administrator roles
- One Adult BLS course format with physical cohorts
- Learner cohort summary
- Learner guide library
- Instructor teaching kit
- Unlisted YouTube videos
- Private PDFs
- One pre-test
- One post-test
- Single-best-answer questions
- Secure server-side scoring
- Permanent and fixed-expiry access
- People, cohort, resource, and quiz administration
- Personal and cohort results
- Basic export and analytics
- Audit logging

Certificates, sequential online modules, learning-path progress, and
resource-completion gates are deferred or excluded.
