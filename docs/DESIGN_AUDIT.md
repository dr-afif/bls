# Product and Interface Design Audit

## Purpose

This audit evaluates the current frontend prototype against the canonical
direction in `PRODUCT_DIRECTION.md`. It proposes an information architecture
and visual options for approval. It does not approve or implement a visual
direction.

## Current-interface audit

### LMS assumptions to remove

- “Dashboard” is treated as the learner’s main product destination.
- “Continue learning” is the dominant learner action.
- Course percentage, completed-resource counts, and progress summaries imply
  online module completion.
- A linear course pathway gates resources and the post-test.
- Resources are described as lessons and arranged as required or optional
  course steps.
- Results direct the learner back to continue learning.
- The course page prioritizes completion and progression instead of quick
  reference.
- Certificate and remediation language implies an LMS completion lifecycle.
- The same learner shell is used as the placeholder experience for instructor
  and administrator roles.

These elements may remain in the repository until the next prototype is
approved, but they are not product requirements.

### Technical and interaction foundations to retain

- React, TypeScript strict mode, Vite, React Router, and Tailwind CSS.
- Feature-based source organization.
- Hash routing suitable for the current GitHub Pages target.
- Route-level lazy loading and reusable loading states.
- Semantic design tokens rather than hard-coded component colours.
- Reusable Button, Badge, Card, and Progress primitives where they remain
  appropriate.
- Lucide iconography.
- Skip link, route focus management, visible keyboard focus, semantic landmarks,
  and reduced-motion support.
- Mobile safe-area handling and fixed-navigation content offsets.
- Responsive shell mechanics: mobile top/bottom navigation and desktop sidebar.
- Reusable loading, empty, offline, access-expired, access-denied, and error
  components.
- Small repository interfaces that isolate mock data from presentation code.
- Explicit prototype/demo-data notices.

### Existing UI elements to replace or reframe

| Current element | Required change |
| --- | --- |
| Learner dashboard | Replace with a practical home screen centered on course logistics, quick guides, and quiz availability. |
| Course pathway | Remove. Physical-course timing and quiz availability replace sequential online steps. |
| Continue-learning card | Replace with “Open guide,” “Prepare for course,” or an available quiz action. |
| Course progress percentage | Remove from learner and instructor primary UI. |
| Completed-resource metrics | Remove unless later evidence supports non-gating usage analytics. |
| Courses navigation | Replace with Guides for learners and Teaching Kit for instructors. |
| Results as a top-level learner tab | Place results inside Quiz, keeping learner navigation to four items. |
| Resource lesson cards | Reframe as guides, checklists, reference documents, and supporting videos. |
| Locked resource states | Use only for genuine authorization or publication restrictions, not module prerequisites. |
| Post-test prerequisite copy | Replace with a clear availability reason tied to the physical course or release policy. |
| Desktop learner sidebar labels | Align with the same role information architecture as mobile. |
| Demo role behavior | Next prototype should render distinct learner, instructor, and administrator shells. |

## Revised information architecture

### Public/demo

```text
Entry
├── Product explanation
├── Prototype boundary
└── Role selector
    ├── Learner
    ├── Instructor
    └── Administrator
```

### Learner

```text
Home
├── Upcoming/current cohort
├── Course date, time, venue, instructor
├── Quick guides
├── Pre-test or post-test availability
└── Important preparation note

Guides
├── Search
├── Topic filters
├── Featured/frequently used
├── Guide, checklist, document, or video
└── Resource viewer

Quiz
├── Pre-test
├── Post-test
├── Availability and reason
├── Attempt entry
└── Personal results

Profile
├── Personal details
├── Cohort summary
├── Access/account state
└── Help and prototype boundary
```

### Instructor

```text
Home
├── Next teaching session
├── Resume/open recent teaching material
├── Teaching-stage shortcuts
└── Assigned-cohort summary

Teaching Kit
├── Search
├── Teaching-stage filters
├── Topic filters
├── Lecture videos
├── Teaching guides
├── Checklists
└── Resource viewer/presenter

Cohorts
├── Assigned cohorts
├── Session details
├── Permitted readiness summary
└── Permitted learner information

Profile
├── Personal details
├── Teaching assignments
└── Help and access state
```

### Administrator

```text
Overview
├── Upcoming cohorts
├── People requiring attention
├── Quiz completion summary
└── Operational shortcuts

People
├── Search and filters
├── Learners
├── Instructors
├── Account/access state
└── Cohort assignments

Cohorts
├── Cohort list
├── Create/edit cohort
├── Schedule and venue
├── Instructor assignment
└── Learner membership

Resources
├── Library
├── Topics and teaching stages
├── Create/edit/version
└── Publication state

Quizzes
├── Pre-test
├── Post-test
├── Questions
├── Release policy
└── Publication state

Results
├── Cohort comparison
├── Individual results
├── Pre-/post-test change
└── Export

Settings
├── Account settings
├── Access policy
└── Course configuration
```

## Low-fidelity screen descriptions

### Learner home

```text
┌─────────────────────────────────┐
│ BLS Companion          Profile  │
│ Prototype · Demo data           │
├─────────────────────────────────┤
│ Your course                     │
│ Sat 8 Aug · 08:30–16:30         │
│ Clinical Skills Centre          │
│ Instructor: Dr Example          │
│ [View cohort details]           │
├─────────────────────────────────┤
│ Before you attend               │
│ Pre-test · Available            │
│ [Start pre-test]                │
├─────────────────────────────────┤
│ Quick guides                    │
│ [Adult CPR] [AED] [Airway]      │
├─────────────────────────────────┤
│ Home   Guides   Quiz   Profile  │
└─────────────────────────────────┘
```

Priority: course logistics first, one current quiz action, then three to five
quick guides. No progress percentage.

### Learner guides library

```text
┌─────────────────────────────────┐
│ Guides                          │
│ [Search guides…]                │
│ [All] [CPR] [AED] [Airway]      │
├─────────────────────────────────┤
│ Frequently used                 │
│ Adult CPR quick guide      ›    │
│ AED safety checklist       ›    │
├─────────────────────────────────┤
│ All guides                      │
│ VIDEO  High-quality CPR    ›    │
│ PDF    Airway checklist    ›    │
│ GUIDE  Recovery position   ›    │
└─────────────────────────────────┘
```

Priority: search, topic filters, descriptive resource type, and one-tap rows.

### Guide/resource viewer

```text
┌─────────────────────────────────┐
│ ‹ Guides       Save for later   │
├─────────────────────────────────┤
│ Adult CPR quick guide           │
│ GUIDE · Updated Jul 2026        │
│                                 │
│ 1. Check response and breathing │
│ 2. Call for help                │
│ 3. Start chest compressions     │
│                                 │
│ [Open supporting video]         │
├─────────────────────────────────┤
│ Related: AED safety checklist   │
└─────────────────────────────────┘
```

Priority: readable content, persistent back path, metadata, and related
references. A video variant places the accessible player first.

### Pre-test and post-test entry

```text
┌─────────────────────────────────┐
│ Quiz                            │
├─────────────────────────────────┤
│ Pre-test                        │
│ Available · Complete before     │
│ Sat 8 Aug, 08:30                │
│ 10 questions · About 8 minutes  │
│ [Start pre-test]                │
├─────────────────────────────────┤
│ Post-test                       │
│ Not available yet               │
│ Opens after your course         │
│ [Why is this unavailable?]      │
├─────────────────────────────────┤
│ Latest result: Pre-test 70%     │
│ [View result]                   │
└─────────────────────────────────┘
```

Priority: availability, deadline/release reason, expected effort, and a single
clear primary action.

### Instructor home

```text
┌─────────────────────────────────┐
│ Good morning, Instructor        │
│ Next session · Today 08:30      │
│ Cohort BLS-2608 · Room 3        │
│ [Open cohort]                   │
├─────────────────────────────────┤
│ Start teaching                  │
│ [Introduction slides]           │
│ [CPR demonstration video]       │
│ [Skills assessment checklist]   │
├─────────────────────────────────┤
│ Recent teaching materials       │
│ AED teaching guide         ›    │
└─────────────────────────────────┘
```

Priority: the next physical session and launch-ready teaching resources.

### Instructor teaching kit

```text
┌─────────────────────────────────┐
│ Teaching Kit                    │
│ [Search materials…]             │
│ Stage: [Opening] [CPR] [AED]    │
├─────────────────────────────────┤
│ Opening                         │
│ VIDEO  Course introduction  ›   │
│ GUIDE  Learning outcomes    ›   │
├─────────────────────────────────┤
│ Skills practice                 │
│ VIDEO  CPR demonstration    ›   │
│ CHECK  Practice checklist   ›   │
└─────────────────────────────────┘
```

Priority: teaching-stage grouping, search, fast launch, and reliable
full-screen presentation.

### Administrator overview

```text
┌───────────────┬──────────────────────────────────────┐
│ Overview      │ Overview                             │
│ People        │ Upcoming cohorts                     │
│ Cohorts       │ [BLS-2608 · 24 people · Sat 8 Aug]  │
│ Resources     │ [BLS-2610 · 18 people · Tue 11 Aug] │
│ Quizzes       │                                      │
│ Results       │ Requires attention                   │
│ Settings      │ 3 unassigned learners                │
│               │ 1 cohort without instructor          │
│               │                                      │
│               │ Quiz readiness                       │
│               │ Pre-test 18/24 · Post-test not open  │
└───────────────┴──────────────────────────────────────┘
```

Priority: upcoming operations and actionable exceptions, not decorative KPIs.

### People management

```text
┌───────────────┬──────────────────────────────────────┐
│ Admin nav     │ People             [Add person]      │
│               │ [Search] [Role] [Cohort] [Status]   │
│               ├──────────────────────────────────────┤
│               │ Name       Role     Cohort   Status  │
│               │ A. Example Learner  BLS-2608 Active  │
│               │ I. Example Instructor 2 cohorts      │
│               └──────────────────────────────────────┘
```

Priority: search, filters, status text, predictable row actions, and responsive
cards below table breakpoints.

### Cohort management

```text
┌───────────────┬──────────────────────────────────────┐
│ Admin nav     │ Cohorts            [Create cohort]   │
│               │ [Upcoming] [Past] [Needs attention] │
│               ├──────────────────────────────────────┤
│               │ BLS-2608 · Sat 8 Aug                │
│               │ 24 learners · Dr Example · Room 3   │
│               │ Pre-test: 18/24 complete       ›    │
└───────────────┴──────────────────────────────────────┘
```

The cohort detail page uses distinct sections for schedule, instructors,
learners, quiz release, and results. Complex editing uses a full page or drawer,
not a small dialog.

### Quiz results and analytics

```text
┌───────────────┬──────────────────────────────────────┐
│ Admin nav     │ Results                              │
│               │ [Cohort] [Quiz] [Date] [Export]     │
│               ├──────────────────────────────────────┤
│               │ BLS-2608 summary                     │
│               │ Pre-test median 68%                  │
│               │ Post-test median 86%                 │
│               │ Change +18 percentage points         │
│               │ [Accessible comparison chart]        │
│               │ [Results data table]                 │
└───────────────┴──────────────────────────────────────┘
```

Priority: exact values and tables first; charts supplement rather than replace
the data. Colour is never the sole signal.

## Proposed visual directions

### Direction A — Clinical Field Guide

**Character:** resource-first, highly scannable, calm, practical.

- Warm off-white background with white content surfaces.
- Deep navy primary, restrained teal accent, amber/red only for status.
- Strong section titles, compact metadata, generous row touch targets.
- Resource rows and grouped lists used more often than dashboard cards.
- Minimal shadow, 10–12 px radius, clear borders.
- System or Inter-like sans serif with high readability.
- Mobile feels like a dependable clinical reference tool.

**Trade-offs:** best fit for quick access and low cognitive load; may feel less
visually distinctive unless typography and spacing are executed carefully.

### Direction B — Calm Clinical Workspace

**Character:** polished, structured, slightly more spacious and branded.

- Cool neutral background, white cards, deep blue and soft teal surfaces.
- Clear header bands and restrained icon tiles for major actions.
- More use of two-column panels on tablets and desktop.
- 12–16 px radius with a consistent low elevation.
- Strong continuity between learner, instructor, and administrator experiences.

**Trade-offs:** feels more premium and accommodates role variation well, but
could drift back toward dashboard-heavy layouts if panels are overused.

### Direction C — Operational Course Companion

**Character:** efficient, dense, schedule- and status-led.

- Near-white background, slate/navy text, blue primary, minimal accent colour.
- Tables, list groups, status lines, and compact filters dominate.
- Smaller radii, almost no shadow, visible dividers.
- Optimized for administrators and experienced instructors.
- Mobile layouts remain touch-safe but carry more information per screen.

**Trade-offs:** strongest for operations and administration; can feel too
institutional or dense for first-time learners.

## Approved direction

Direction A, **Clinical Field Guide**, is approved for learner and instructor
experiences because it supports one- or two-tap resources, mobile use during a
physical course, and the explicit rejection of LMS dashboards.

Direction C, **Operational Course Companion**, is approved as the density
variant for administrator screens. All roles retain the same semantic tokens,
typography, focus treatment, status conventions, and component language.

The role-aware frontend prototype implements this combination. The next design
checkpoint is representative-user validation, not another visual-direction
selection.
