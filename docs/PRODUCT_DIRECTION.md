# Product Direction

This document is the canonical product brief for the BLS Learning PWA. Where
older product language conflicts with this document, this document takes
precedence.

## Product purpose

BLS Learning is a companion application for people organizing, teaching, and
attending a physical Basic Life Support course.

It gives learners quick access to practical course references and required
pre- and post-tests, gives instructors a dependable teaching toolkit, and gives
administrators the operational tools needed to manage people, cohorts,
resources, quizzes, and results.

The product supports an in-person course. It does not deliver a self-paced
online course.

## Target users

### Learners

People enrolled in or assigned to an in-person BLS course cohort. They may be
healthcare workers, students, trainees, or other authorized participants.

### Instructors

People delivering the physical BLS course. They need dependable, fast access to
lecture videos, teaching guides, checklists, and cohort context while teaching.

### Administrators

People responsible for course operations, user records, cohorts, resources,
quiz content, access status, results, analytics, and exports.

## Role responsibilities

### Learner responsibilities

- View basic cohort and physical-course information.
- Access practical guides, reference documents, and supporting videos.
- Complete the pre-test before the physical course.
- Complete the post-test after the physical course.
- Review personal quiz results.
- Maintain relevant profile and contact information when permitted.

### Instructor responsibilities

- Find teaching materials by topic or teaching stage.
- Open lecture videos, guides, checklists, and reference documents quickly.
- Use the application as a teaching toolkit during the physical course.
- View relevant assigned-cohort information where appropriate.
- Avoid using the application as a learner-progress or online-module system.

### Administrator responsibilities

- Manage learner, instructor, and administrator records.
- Create and maintain cohorts and physical-course details.
- Assign users to cohorts.
- Manage account and access status.
- Maintain resources and quiz content.
- Review pre-test and post-test results.
- View cohort-level analytics and prepare exports.

## Primary use cases

1. A learner checks the date, venue, and status of an upcoming BLS course.
2. A learner opens a CPR guide or supporting video within one or two taps.
3. A learner starts the pre-test before attending the course.
4. A learner starts the post-test after the in-person session.
5. An instructor launches a teaching video, checklist, or topic guide while
   delivering the course.
6. An instructor checks the people or timing associated with an assigned
   cohort.
7. An administrator creates a cohort and assigns learners and instructors.
8. An administrator maintains course resources and quiz content.
9. An administrator reviews individual and cohort pre-/post-test results.
10. An administrator exports operational or results data.

## Explicit non-goals

- A self-paced LMS or online course-delivery platform.
- Online modules, lessons, completion pathways, or sequential resource gates.
- Gamification, streaks, badges, leaderboards, or decorative progress systems.
- Replacing the physical skills session or instructor-led teaching.
- SCORM delivery or a public course marketplace.
- Social feeds, billing, subscriptions, or video conferencing.
- Certificates in the current MVP.
- Backend, authentication, protected-content delivery, or real-user data in the
  current frontend prototype milestone.
- Absolute prevention of screenshots, recording, or copying.

## Mobile and desktop priorities

### Learners

Mobile-first. The most common actions must work comfortably on a small phone
with one hand. Desktop remains supported.

### Instructors

Mobile-first and tablet-friendly. Frequently used resources must remain easy to
launch during teaching, including in landscape orientation. Desktop remains
supported.

### Administrators

Desktop-first and responsive. Data tables, filters, bulk actions, and
side-by-side context should use available space while retaining functional
mobile fallbacks.

## Proposed navigation

### Learner

- Home
- Guides
- Quiz
- Profile

### Instructor

- Home
- Teaching Kit
- Cohorts
- Profile

### Administrator

- Overview
- People
- Cohorts
- Resources
- Quizzes
- Results
- Settings

## MVP scope

The first functional MVP should include:

- Role-aware authenticated access for learners, instructors, and
  administrators.
- Learner cohort and physical-course summary.
- Learner guide and supporting-resource library.
- Instructor teaching kit organized by topic and teaching stage.
- Resource detail/viewer patterns for documents and videos.
- One pre-test and one post-test with secure server-side scoring.
- Personal learner results.
- People and account-status administration.
- Cohort creation, editing, and membership assignment.
- Resource and quiz-content administration.
- Cohort and individual results views with basic comparison and export.
- Responsive role-specific navigation and required system states.
- Auditability and authorization appropriate to real user data.

## Deferred production features

- Certificates and public certificate verification.
- Advanced analytics and item discrimination.
- Practical-skills assessment sign-off.
- Instructor feedback workflows.
- Multiple organizations or tenant administration.
- Native application wrappers.
- Managed secure offline content.
- Stronger tokenized video hosting.
- Automated clinical-guideline review reminders.
- Advanced bulk operations beyond the core cohort workflow.

## Approved product decisions

- The product is an in-person BLS course companion.
- The product is not a self-paced LMS.
- Resources are organized for quick reference and teaching use, not as online
  modules.
- Learner and instructor experiences are mobile-first.
- The administrator experience is desktop-first and responsive.
- Learner navigation is Home, Guides, Quiz, and Profile.
- Instructor navigation is Home, Teaching Kit, Cohorts, and Profile.
- Administrator navigation is Overview, People, Cohorts, Resources, Quizzes,
  Results, and Settings.
- The technical foundation of the frontend prototype may be reused.
- Direction A, Clinical Field Guide, is approved for learner and instructor
  experiences; Direction C's compact operational density is approved for
  administrator screens.
- Learners see course date, time, venue, instructor, contact, and preparation
  notes.
- Learner guides are organized primarily by BLS topic, with guide, checklist,
  document, and video type filters.
- Learners see their score and topic summary. Question-level review remains a
  future policy decision for the production quiz engine.
- The prototype represents one current cohort and a historical-cohort state.
- Instructors may see assigned learner names and pre-test completion status,
  but never learner answers.
- The Teaching Kit is organized by teaching stage with additional topic and
  resource-type filters.
- An authorized instructor or administrator manually releases the post-test
  after the physical course. The prototype demonstrates local visual states
  only; it does not enforce release authority.
- The first planned exports are cohort roster CSV, quiz results CSV, and a
  combined pre-/post-test comparison CSV.
- Backend implementation follows the frontend prototype.
- The product owner accepted the documented simulated-persona sessions as proxy
  validation for the prototype information architecture because recruiting
  representative users was not practical. This is a delivery decision, not a
  claim of independent human-subject validation.
- Retain the current source-owned Radix/shadcn-style component layer and
  Tailwind CSS v3 for production work. HeroUI React v3 and Tailwind CSS v4 are
  not adopted at this checkpoint.
- Authentication, authorization, protected storage, secure scoring, and audit
  controls become mandatory before real user data or protected resources are
  introduced.
- Multi-course cohorts: a cohort may contain multiple courses via `cohort_courses` join table, supporting optional per-course schedule and venue overrides (`start_at`, `end_at`, `venue`); every learner enrolled in a cohort receives access to every course attached to that cohort (Milestone 7).
- Controlled learner onboarding: staff enter email only on the cohort roster (`public.cohort_learner_roster`); learners supply their legal full name, normalized National Identity (I.C.) number (12-digit MyKad or Passport), preferred language, and password during first-time registration (Milestone 7).
- 7-day application invitation lifecycle with anti-scanner defense, idempotency, server-derived effective expiry, and superseding resend, referencing exactly one authorization intent target (`cohort_learner_roster` or `staff_access_entries`) (Milestone 7).
- Existing user reuse: returning active learners are immediately enrolled upon invitation dispatch; a notification email provides a 7-day link that exchanges for a short-lived Auth token, granting passwordless return into the app without forced password changes or personal data re-registration (Milestone 7).
- Strict staff hierarchy & durable staff intent: backed by `public.staff_access_entries`; super-administrators stage administrators and instructors; administrators stage instructors; instructors manage learners strictly within assigned cohorts; removing staff intent never deletes user accounts (Milestone 7).
- Reversible cohort learner-access gate: administrators can toggle `learner_access_state` between `open` and `closed` without destroying accounts, enrollments, or historical attempt data (Milestone 7).
- National Identity (I.C.) privacy: full I.C. numbers are protected in `private.learner_identities` (no direct browser SELECT), visible only to authorized administrators and the learner themselves via secure RPCs; instructors see strictly server-derived masked identifiers (`******-**-1234`) (Milestone 7).
- Bilingual foundation: full bilingual support in English (`en`, default/fallback) and Bahasa Melayu (`ms`), with separate human-authored educational content and historically frozen bilingual quiz questions (Milestone 7).

## Remaining production decisions

- Revisit terminology, task priority, and density when access to representative
  users becomes practical; this is no longer a blocker for backend
  implementation.
- Evaluate certificates and public verification for post-MVP releases.

## Milestone terminology

Milestone 6 delivered the validated production application baseline. Milestone 7
delivers controlled onboarding, multi-course cohorts, and the bilingual foundation
prior to the final pre-launch clean-slate reset and physical course pilot.
