# UI and UX Specification

> Use this document with `PRODUCT_DIRECTION.md` and `DESIGN_AUDIT.md`. The
> corrected experience is a resource-first companion for a physical course, not
> an LMS.

## Design direction

The interface should resemble a dependable clinical field guide and teaching
toolkit rather than an LMS or generic administrative dashboard.

The approved implementation uses Clinical Field Guide styling for learner and
instructor screens and the denser Operational Course Companion treatment for
administrator screens. Shared tokens and accessible interaction conventions
keep the three role experiences coherent.

Characteristics:

- Calm
- Clear
- Professional
- Accessible
- Mobile-friendly
- Low visual clutter
- Resource-first
- Practical and operational
- Minimal unnecessary animation

Avoid decorative dashboards, course-completion pathways, gamification, and
progress metrics that imply online module completion.

## Design tokens

Suggested semantic tokens:

```text
background
foreground
card
card-foreground
primary
primary-foreground
secondary
secondary-foreground
muted
muted-foreground
border
input
ring
success
warning
destructive
info
```

Suggested visual behaviour:

- Background: soft grey or off-white
- Cards: white with subtle border
- Primary: deep blue or medical teal
- Success: green
- Warning: amber
- Destructive: red
- Information: blue
- Border radius: 8 to 12 pixels
- Typography: Inter or system font stack

## Responsive strategy

### Desktop

- Persistent or collapsible left sidebar for administrators
- Adaptive sidebar or wider content navigation for learner and instructor views
- Top header
- Breadcrumbs for deep administrative and resource-management pages
- Main content area
- Lists and grouped resources before card grids
- Tables for administration
- Side panels or drawers for details

### Mobile

- Compact top bar
- Four-item learner or instructor bottom navigation
- Slide-over navigation drawer
- Single-column resource lists
- Sticky primary actions
- Bottom sheets for quiz navigation and filters
- User cards instead of wide data tables
- Minimum practical touch target around 44 by 44 pixels

## Learner navigation

Recommended mobile items:

- Home
- Guides
- Quiz
- Profile

## Instructor navigation

- Home
- Teaching Kit
- Cohorts
- Profile

## Admin navigation

- Overview
- People
- Cohorts
- Resources
- Quizzes
- Results
- Settings

## Public pages

### Login

Desktop:

```text
Branding or BLS visual | Login form
```

Mobile:

- Logo
- Welcome message
- Email
- Password
- Sign in
- Forgot password
- Signup or invitation help

### Signup

Suggested steps:

1. Account details
2. Personal details
3. Invite or registration code
4. Terms acceptance
5. Verification result

## Learner home

Primary content:

- Current or upcoming physical-course cohort
- Date, time, venue, instructor, and preparation notes
- Pre-test or post-test availability and reason
- Frequently used guides
- Important operational message
- Access or account-status state where relevant

The most important action should be visually dominant.

Do not show completion percentages, resource counts, course pathways, or
“continue learning” as the primary home hierarchy.

## Learner guides library

- Search
- Topic filters
- Frequently used guides
- Resource type and estimated viewing time
- Guides, checklists, reference documents, and supporting videos
- Clear empty and unavailable states

Resource status labels:

- Available
- Updated
- Unavailable
- Access expired
- Draft or unpublished for administrative views

Do not use required/optional or completed/in-progress as a default learner
resource taxonomy.

## Instructor home

Primary content:

- Next physical teaching session
- Cohort, time, and venue
- One-tap teaching-stage shortcuts
- Recent teaching materials
- Permitted cohort readiness summary

## Instructor teaching kit

- Search
- Teaching-stage filters
- BLS topic filters
- Lecture or demonstration videos
- Teaching guides
- Skills checklists
- Recently used materials
- Full-screen or presentation-friendly resource viewing

## Video resource

Components:

- Back navigation
- Resource title
- Resource type, topic, and update metadata
- Embedded player
- Dynamic watermark overlay
- Transcript
- Key points
- Related resources

## PDF or guide resource

Toolbar may include:

- Previous page
- Next page
- Current page
- Zoom out
- Zoom in
- Fit width
- Fullscreen

Do not include:

- Download
- Save
- Print
- Open original file

Show a visible user-specific watermark across the viewer.

## Quiz introduction

Show:

- Quiz type
- Number of questions
- Time allowed
- Attempt number
- Passing score
- Review policy
- Start button

## Active quiz

Desktop layout:

- Main question panel
- Right-side question navigator
- Visible timer
- Previous and next actions
- Submit action

Mobile layout:

- Question number and timer
- Progress bar
- Question and options
- Sticky previous and next controls
- Navigator in bottom sheet

Autosave states:

- Saving
- Saved
- Unable to save
- Offline

## Results page

Show:

- Quiz name
- Score
- Pass or fail
- Passing mark
- Correct count
- Duration
- Topic performance
- Topic summary where policy permits
- Retake action where allowed
- Clear explanation when detail is restricted

For the current prototype, show score and topic summary. Question-level review
and explanations remain subject to a future production review policy.

## Post-test release

The post-test is manually released after the physical course by an authorized
instructor or administrator. Frontend-only prototypes may demonstrate released
and unreleased states, but must label them as local visual previews and must not
imply that authority or timing is securely enforced.

## Administrator overview

Prioritize action over decoration:

- Upcoming cohorts
- Cohorts missing instructors, venues, or members
- People requiring account or assignment attention
- Pre-test and post-test completion readiness
- Recent administrative actions
- Shortcuts to create a cohort, add a person, or publish a resource

Avoid decorative KPI walls. Every summary should support a clear operational
decision or navigation action.

## User management

Desktop:

- Search
- Filters
- Paginated table
- Row action menu
- Detail drawer or page

Mobile:

- Search
- Filter bottom sheet
- User cards
- Action menu

## Cohort editor

Use clear sections:

```text
Cohort
├── Schedule and venue
├── Instructor assignments
├── Learner membership
├── Preparation information
├── Quiz release
└── Results summary
```

Provide:

- Searchable people assignment
- Clear unsaved-change state
- Validation next to affected fields
- Full-page or drawer editing
- Audit-aware administrative actions

## Resource administration

Organize resources by:

- Audience
- BLS topic
- Teaching stage
- Resource type
- Publication and clinical-review state

Ordering may be used for presentation within a topic or stage, but must not
imply a learner completion pathway.

## Question editor

Use a full page or large drawer.

Fields:

- Question type
- Question text
- Optional image
- Answer options
- Correct answer
- Explanation
- Reference
- Topic
- Difficulty
- Review status
- Reviewer
- Next review date

## Analytics

Use charts only when they answer a clear question.

Recommended:

- Line chart for trend
- Bar chart for topic performance
- Stacked bar for pass and fail comparison
- Score distribution
- Completion funnel
- Question-analysis table

Avoid excessive pie charts and decorative metrics.

Planned first exports are cohort roster CSV, quiz results CSV, and combined
pre-/post-test comparison CSV. Prototype controls must not generate real files
or imply that authorization, data scoping, or audit logging exists.

## Empty states

Every list should have a useful empty state:

- No upcoming cohort
- No resources published
- No attempts yet
- No users match filters
- No cohorts match filters
- No audit events
- No analytics for selected range

## Error states

Provide distinct states for:

- Offline
- Session expired
- Access expired
- Access denied
- Resource unavailable
- Quiz unavailable
- Attempt already submitted
- General server error

## Motion

- Keep transitions subtle.
- Respect reduced-motion preferences.
- Do not animate clinical status changes excessively.
- Avoid motion that delays quiz interaction.
