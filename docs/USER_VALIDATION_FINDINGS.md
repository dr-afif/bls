# User Validation Findings (Owner-Accepted Proxy Validation)

> **Evidence boundary:** These sessions were simulated with AI personas rather
> than observed with recruited participants. On 2026-08-07, the product owner
> accepted this proxy evidence as sufficient to make the prototype product
> decisions and proceed to production planning because representative-user
> recruitment was not practical. The findings must not be described externally
> as independent clinical, usability, or human-subject validation.

## Executive Summary

Six simulated sessions were conducted (3 Learners, 2 Instructors, 1 Administrator) based on `USER_VALIDATION_SCRIPT.md`. 
Overall, the prototype successfully conveys the "physical course companion" model, cleanly breaking away from the self-paced LMS paradigm. The terminology changes (e.g., "Teaching Kit", "Operations") resonated well. Task completion rates were high (>90% independent success).

**Owner decision:** Approved for production architecture planning with minor
follow-up usability work. No proxy finding requires the information
architecture to be reopened before Milestone 2.

### Key Insights
- **Learners** intuitively understood the separation of physical course logistics (Home) and clinical reference material (Guides). The Quiz tab correctly set expectations around pre/post-test release mechanics.
- **Instructors** heavily utilized the "Teaching Kit" and valued the clear boundary that hides exact learner quiz answers while exposing completion status.
- **Administrators** found the dense tabular data manageable on desktop and appreciated the explicit prototype boundaries (e.g., Export buttons).

---

## Session Information Summary

- **L-S1 (Learner):** Ward Nurse, Mobile (375x812). Highly successful, recognized app as companion.
- **L-S2 (Learner):** Junior Doctor, Mobile (320x800). Minor hesitation finding pre-test initially (looked in Profile before Quiz).
- **L-S3 (Learner):** Medical Student, Mobile (375x812). Tech-savvy, requested correct answers post-quiz, validating the intentional withholding design.
- **I-S1 (Instructor):** Experienced Trainer, Tablet (1024x768). Appreciated "Teaching Kit". Minor friction exiting presentation mode.
- **I-S2 (Instructor):** Occasional Trainer, Mobile (375x812). Slight hesitation with stage filtering in Teaching Kit but successfully completed.
- **A-S1 (Administrator):** Operations Manager, Desktop (1440x900). Handled dense tables perfectly. Understood prototype constraints immediately.

## Task Completion Summary (Aggregated)

- **Total Tasks Attempted:** 61 (L: 30, I: 20, A: 11)
- **Tasks Completed Independently:** 56 (91.8%)
- **Tasks Completed with Assistance:** 5 (8.2%)
- **Tasks Not Completed:** 0 (0%)

---

## Notable Finding Records

### Finding 1: Learner Pre-Test Discoverability
- **Task Identifier:** L5 (Check pre-test status/availability)
- **Task Outcome:** Pass with assistance
- **Completion Status:** Completed
- **Time/Difficulty Observation:** L-S2 spent 30 seconds looking in the "Profile" tab for their pre-test before navigating to the "Quiz" tab.

#### Issues Encountered
- **Assistance Required:** Yes - Moderator asked "Where else might your assessments live?"
- **Navigation Error:** Navigated to Profile initially, expecting "My Tasks" or similar LMS dashboard.
- **Trust or Prototype-Boundary Confusion:** None.

#### Direct Participant Comment
> "I thought my pending assignments would be under my profile, but having a dedicated Quiz tab makes sense once you see it."

#### Evaluation & Action
- **Severity:** Low (Learners adapt quickly)
- **Confidence:** High
- **Recommended Action:** Monitor in real-world usage. Consider adding a "Pending Quiz" alert on the Home tab if this persists.
- **Decision Status:** Deferred

---

### Finding 2: Instructor Presentation Mode Exit
- **Task Identifier:** I4 (Enter/exit presentation view)
- **Task Outcome:** Pass with assistance
- **Completion Status:** Completed
- **Time/Difficulty Observation:** I-S1 entered presentation mode easily but tried to tap the center of the tablet screen to exit, before realizing they needed to use the explicit close button or Esc key.

#### Issues Encountered
- **Assistance Required:** Yes - "What are you trying to do to close this?"
- **Navigation Error:** Expected a generic "tap to dismiss" overlay behavior.

#### Direct Participant Comment
> "I instinctively tapped the background to exit the full-screen view."

#### Evaluation & Action
- **Severity:** Medium
- **Confidence:** Medium
- **Recommended Action:** Ensure a highly visible 'Close' (X) button is always present in the presentation mode overlay for touch devices.
- **Decision Status:** Approved (for future implementation)

---

### Finding 3: Administrator Export Controls (Prototype Boundary)
- **Task Identifier:** A10 & A11 (Find planned exports & Explain boundaries)
- **Task Outcome:** Pass
- **Completion Status:** Completed Independently
- **Time/Difficulty Observation:** A-S1 instantly recognized the buttons were placeholders due to the explicit "Demo Data" badge and visual styling.

#### Issues Encountered
- **Trust or Prototype-Boundary Confusion:** None. The prototype boundaries were successfully communicated.

#### Direct Participant Comment
> "I see the export CSV buttons, but given the 'Demo Data' badge and the prompt, I know these won't generate real files yet. It shows me exactly where they will be, though."

#### Evaluation & Action
- **Severity:** Observation
- **Confidence:** High
- **Recommended Action:** The boundary communication strategy is working effectively. Maintain the current labelling.
- **Decision Status:** Approved

---

### Finding 4: Information Boundaries (Privacy)
- **Task Identifier:** I10 (Explain visible learner info)
- **Task Outcome:** Pass
- **Completion Status:** Completed Independently
- **Time/Difficulty Observation:** I-S2 clearly understood they could only see completion status (checkmarks) and not the actual scores or answers of their assigned learners.

#### Issues Encountered
- **Content-Priority Problem:** None. The absence of scores was noted as a positive feature for physical skills trainers who only need to know if the learner is cleared to attend.

#### Direct Participant Comment
> "I like that I just see a checkmark. I don't need to know they failed twice before passing; I just need to know they did the pre-reading."

#### Evaluation & Action
- **Severity:** Observation
- **Confidence:** High
- **Recommended Action:** Maintain strict RLS policies in production to enforce this intentional data masking.
- **Decision Status:** Approved

---

## Session-Level Conclusions

- **Most confusing element:** For a minority of users with heavy LMS experience, the absence of a "Next Lesson" or "Progress Bar" required a brief mental adjustment.
- **Most useful element:** The **Teaching Kit** for instructors, and the **Guides** tab for learners, providing immediate, un-gated access to clinical reference material.
- **Participant's desired change:** Instructors requested a "Tap anywhere to dismiss" for presentation mode on tablets.

### Overall Ratings (Aggregated Averages)
- **Overall Confidence:** 4.8 / 5
- **Confusion:** 1.5 / 5
- **Trust:** 4.5 / 5
- **Perceived Usefulness:** 4.9 / 5
