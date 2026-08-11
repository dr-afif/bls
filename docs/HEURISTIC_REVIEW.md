# Auditable Heuristic Review Record

**Review Date:** 2026-08-06  
**Build Evaluated:** Local Vite Development Server (`npm run dev`) at `http://localhost:5175/`  

> **Scope Note:** This is a targeted heuristic review conducted via a mix of rendered browser inspection (simulated viewports via browser tools) and source-code structural inspection. This document records that targeted heuristic and browser checks passed, but it is **not a formal accessibility audit** and does not claim complete WCAG 2.2 AA conformance.

## 1. Automated Static Checks
- **Typecheck (`tsc -b`):** Passed with 0 errors.
- **Lint (`eslint .`):** Passed with 0 errors.
- **Unit/Component Tests (`vitest run`):** 6 files, 10 tests passed.
- **Build (`vite build`):** Passed (1,620 modules transformed).

## 2. Routes and Viewports Inspected

### Public/Demo Routes
- **Routes:** `/` (Demo Role Selector)
- **Viewports:** Mobile (320x800, 375x812), Desktop (1440x900)
- **Interaction:** Navigated using mouse and keyboard (`Tab`). 
- **Evidence (Source):** Role options are properly grouped radio buttons.
- **Evidence (Rendered):** Focus indicator ring is visible on keyboard focus.
- **Console:** Clean.

### Learner Routes
- **Routes:** `/#/demo/learner/home`, `/#/demo/learner/guides`, `/#/demo/learner/guides/:resourceId`, `/#/demo/learner/quiz`, `/#/demo/learner/quiz/result`, `/#/demo/learner/profile`
- **Viewports:** Mobile (320x800, 375x812)
- **Interaction:** Triggered skip link via keyboard; opened guides; observed layout reflow.
- **Evidence (Rendered):** Bottom navigation remains fixed.
- **Evidence (Source):** Flex properties and responsive bounds are structured to prevent horizontal overflow at 320px width.
- **Console:** Clean.

### Instructor Routes
- **Routes:** `/#/demo/instructor/home`, `/#/demo/instructor/teaching-kit`, `/#/demo/instructor/teaching-kit/:resourceId`, `/#/demo/instructor/cohorts`, `/#/demo/instructor/profile`
- **Viewports:** Tablet (1024x768)
- **Interaction:** Resized window to force layout shift; verified presentation mode escape behavior via source inspection.
- **Evidence (Rendered):** Responsive bounds respect tablet dimensions. "Teaching Kit" renders distinctly from "Resources".
- **Evidence (Source):** Presentation mode is closed by the resource viewer's document keydown listener updating local React state.
- **Console:** Clean.

### Administrator Routes
- **Routes:** `/#/demo/admin/overview`, `/#/demo/admin/people`, `/#/demo/admin/cohorts`, `/#/demo/admin/resources`, `/#/demo/admin/quizzes`, `/#/demo/admin/results`, `/#/demo/admin/settings`
- **Viewports:** Desktop (1440x900)
- **Interaction:** Tabbed through dense tables; inspected empty states.
- **Evidence (Rendered):** Tables reflow into cards or allow horizontal scrolling without breaking page layout.
- **Evidence (Source):** Status badges use explicit text (e.g., "Active").
- **Console:** Clean.

## 3. Objective Findings & Resolutions

### HR-01 — Invalid Route Heading Semantics
- **Review Date:** 2026-08-06
- **Exact Local URL:** `http://localhost:5175/#/invalid-path`
- **Viewport:** Desktop (1440x900)
- **Interaction Exercised:** Navigated to a non-existent route.
- **Evidence Observed (Rendered):** The `StatePanel` rendered the "Page not found" title as an `h2`, leaving the page without an `h1`.
- **Console Result:** Clean.
- **Finding ID:** HR-01
- **Severity:** Medium (Accessibility semantic hierarchy)
- **Recommendation:** Implement a heading-level prop in `StatePanel` and pass `as="h1"` for the standalone not-found route.
- **Resolution Status:** **Corrected**. Added `as` prop to `StatePanel` and updated `not-found-page.tsx`. Verified via source inspection.

### HR-02 — Compact Header Overlap / Clutter
- **Review Date:** 2026-08-06
- **Exact Local URL:** `http://localhost:5175/#/demo/learner/home` and `/#/demo/admin/overview`
- **Viewport:** Mobile Narrow (320x800)
- **Interaction Exercised:** Viewport narrowed to minimum supported width.
- **Evidence Observed (Rendered):** The secondary `DemoBanner` row consumed excessive vertical space, and at narrow widths the header density was suboptimal.
- **Console Result:** Clean.
- **Finding ID:** HR-02
- **Severity:** Low (Polish/Layout)
- **Recommendation:** Refactor mobile compact headers (`field-shell.tsx` and `admin-shell.tsx`) to combine the "prototype" text and a compact "Demo Data" badge into a single line, removing the secondary border-t row.
- **Resolution Status:** **Corrected**. Integrated a `text-xs` badge next to the role label within a flexible wrapping container and removed the lower row.
- **Evidence (Rendered):** Learner, instructor, and administrator prototype/demo-data labels were fully visible without truncation or horizontal page-level overflow at both 320x800 and 375x812.

## 4. Subjective Questions (Deferred to Validation Sessions)
*These observations require representative-user evidence.*
- **OBS-01:** Does "Teaching Kit" resonate better than "Resources" for physical course instructors?
- **OBS-02:** Is the density on the Administrator "Overview" screen overwhelming when multiple exceptions exist?
- **OBS-03:** Does the Learner "Home" screen sufficiently prioritize physical logistics over the Quick Guides layout for real users?
