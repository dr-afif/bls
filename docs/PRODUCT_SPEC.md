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
Staff stages learner email on cohort roster (intent only)
  ↓
Invitation dispatched:
  ├─ NEW LEARNER: 7-day invitation sent (bilingual EN + BM)
  │    ↓
  │  Recipient clicks link & lands on intermediary acceptance screen (anti-scanner defense)
  │    ↓
  │  Registration: supplies full name, normalized I.C. (MyKad 12-digit / Passport), preferred language (EN/MS), password
  │    ↓
  │  Atomic registration: identity stored in private.learner_identities, account active, cohort & courses effective
  │
  └─ EXISTING ACTIVE LEARNER:
       ↓
     Instant enrollment: cohort membership & multi-course entitlements activated immediately upon send
       ↓
     Notification email delivered with schedule (resolving course overrides) & 7-day return link
       ↓
     Recipient clicks link → intermediary screen → clicks "Open Cohort"
       ↓
     One-time Auth token exchange: authenticated directly into app without entering old password (password unchanged)
  ↓
Home and cohort details (all attached courses with schedule/venue overrides where defined)
  ↓
Preparation guidance and practical references
  ↓
Pre-test
  ↓
Attend physical BLS course
  ↓
Post-test released by instructor or administrator
  ↓
Post-test
  ↓
View result
```

## Functional modules

### Authentication and onboarding

- Email-only pre-invitation roster staging (`public.cohort_learner_roster`)
- Durable staff authorization intent (`public.staff_access_entries`) before Auth accounts exist
- 7-day application invitation lifecycle (`public.access_invitations`) referencing exactly one authorization intent target
- Server-enforced effective expiry (`status = 'sent' AND expires_at <= now()`) independent of cron
- First-time learner registration: full name, normalized I.C. number (12-digit MyKad or Passport), preferred language (`en` or `ms`), password
- Safe duplicate identity protection failing cleanly without user enumeration
- Returning learner instant enrollment upon invitation dispatch and one-time passwordless return link flow
- Strict staff onboarding hierarchy: super-administrators stage administrators and instructors; administrators stage instructors; instructors manage learners strictly within assigned cohorts; removal of staff intent never deletes user accounts
- Login, logout, and account-level password recovery
- Account states: `pending_verification`, `pending_registration`, `pending_approval`, `active`, `suspended`, `expired`, `archived`
- Protected National Identity (I.C.) boundary: private schema table `private.learner_identities` denying direct browser SELECT; full values accessible only via authorized RPCs to administrators and self; server-derived masked projection (`******-**-1234`) for instructors

### Learner home and guides

- Current or upcoming cohort with all attached courses
- Course date, time, venue, instructor, and preparation notes (resolving per-course schedule and venue overrides)
- Quick access to frequently used guides
- Searchable practical guides, documents, checklists, and supporting videos
- Bilingual interface (English and Bahasa Melayu) with user preference persistence
- Pre-test and post-test availability
- Reversible cohort access status handling (`open` / `closed`)

### Instructor teaching toolkit

- Next teaching session and assigned-cohort context
- Materials grouped by teaching stage or BLS topic
- Lecture and demonstration videos
- Teaching guides and checklists
- Search and recent materials
- Assigned cohort roster management (with server-derived masked I.C. view)
- Post-test release for assigned cohorts


### Cohorts

- Multi-course association via `cohort_courses` join model (all cohort learners receive all attached courses)
- Optional per-course schedule and venue overrides (`start_at`, `end_at`, `venue`) inheriting parent cohort values when null
- Physical-course dates, times, venues, and notes
- Learner and instructor membership
- Reversible cohort learner-access gate (`learner_access_state = 'open' | 'closed'`)
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

- Multiple attached courses (every learner enrolled receives all attached courses)
- Reversible learner access state (`learner_access_state`: `open` | `closed`)
- Multiple assigned instructors
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

Account states:

- `pending_verification` (Auth identity created; email verification pending)
- `pending_registration` (Email verified; learner registration of full name, I.C., and language pending)
- `pending_approval` (Optional approval queue)
- `active` (Fully registered, active account)
- `suspended` (Globally suspended by administrator)
- `expired` (Account access period ended)
- `archived` (Historical or retired account)

Account status, cohort membership, and course entitlement are separate concepts.

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
