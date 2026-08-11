# Representative User Validation Plan

## Purpose and Objectives
The primary purpose of this validation is to test the role-aware frontend prototype with representative users to ensure the information architecture, terminology, navigation, and content density meet the operational needs of an in-person BLS course. This validation must be completed before investing in the production backend architecture.

## Key Questions to Answer
1. Can learners easily find their physical course details and required pre-course resources?
2. Do instructors understand how to access their teaching kit during a live session?
3. Can administrators easily discover where they would expect to manage cohorts, assign roles, and review completion readiness?
4. Does the app correctly feel like a companion to an in-person course rather than a self-paced LMS?
5. Is the terminology intuitive for medical and operational personnel?

## Participant Profiles and Recommended Mix
We need actual practitioners to validate the context and workflows.
- **Learners:** At least 3 participants (healthcare workers, trainees, or typical BLS students).
- **Instructors:** At least 2 BLS instructors who regularly teach physical courses.
- **Administrators:** At least 1 course administrator or operations manager.

## Recruitment Considerations
- Avoid recruiting internal developers or stakeholders as proxy users.
- Select individuals with varying levels of technical comfort.

## Test Environment and Device Guidance
- **Learners:** Test primarily on mobile devices (e.g., 375×812 phone dimensions).
- **Instructors:** Test on mobile phones and tablets (e.g., 1024×768 landscape).
- **Administrators:** Test on desktop monitors (e.g., 1440×900 desktop).
- *Ensure the prototype is run locally or on a secure staging URL.*

## Moderator Preparation
- Understand the prototype’s boundaries (fictional data, no backend persistence).
- Review the `USER_VALIDATION_SCRIPT.md` thoroughly before sessions.
- Prepare to reset the local browser state between sessions to ensure a clean prototype state.

## Session Details
- **Duration:** 30–45 minutes per participant.
- **Format:** Remote screen-share or in-person observation with a dedicated note-taker.

## Consent, Privacy, and Note-Taking
- Obtain verbal or written consent to observe the session.
- **CRITICAL:** Explicitly instruct participants **not to enter real sensitive, medical, employment, account, or learner information** anywhere in the prototype.
- Focus notes on behaviors, hesitation, and direct quotes rather than arbitrary metrics.

## Success Measures
Define measurable prototype-validation thresholds:
- At least 80% of participants complete core role tasks without moderator assistance.
- Critical physical-course details are found successfully by all learner and instructor participants.
- Frequent resources are reached within one or two intentional navigation actions.
- No participant mistakes the prototype for a secure production system after the boundary explanation.
- No repeated High or Critical navigation problem remains unresolved.
- Subjective preferences are not treated as defects without supporting evidence.

## Observation Categories
- Completion Outcome (Independently, With Assistance, Not Completed)
- Time or Difficulty (Hesitations, dead ends)
- Assistance Required (Type and frequency of moderator prompts)
- Navigation Errors (Getting lost, looping)
- Terminology Confusion (Misunderstood labels)
- Content Priority Problems (Important info obscured)
- Density/Readability Feedback (Cluttered vs sparse)
- Accessibility Feedback (Target sizes, contrast)
- Trust or Prototype Boundary Confusion (Expecting real data persistence)
- Direct Participant Comments (Verbatim quotes)

## Role-Specific Scenarios (Discoverability vs Functional)
*Note: Because this is a frontend prototype with local state, changes (like assigning an instructor or completing a quiz) do not persist to a backend. The validation focuses on discoverability and expected workflows.*
- **Learner:** Preparing for an upcoming course and checking quiz status.
- **Instructor:** Preparing to teach a physical BLS session and pulling up the appropriate guide or video.
- **Administrator:** Discovering where to check cohort readiness, and testing where they *expect* to manage roles and publish resources (since real assignment is not functional).

## Post-Session Questions
- Did this tool feel like it supports a physical course?
- What felt missing for your role?
- Was anything confusing or overly complex?

## Post-Validation Approval Criteria
- **Approved:** The current architecture and density support operations smoothly. 80%+ task success. Move to Milestone 2.
- **Approved with minor revisions:** Small terminology or spacing fixes needed, but the core architecture is sound. Move to Milestone 2.
- **Requires another validation round:** High/Critical navigation errors encountered. Fixes must be made and re-tested.
- **Not approved:** Fundamental navigation or density must be redesigned before proceeding.

*The product team will review findings. Conflicting feedback will be resolved by adhering to the documented Product Direction (prioritizing physical-course logistics over LMS patterns).*

## Prioritizing Findings
- Focus on Critical and High severity issues (blocking tasks, causing trust loss).
- Subjective preference findings should be grouped and reviewed holistically, not immediately actioned.

> [!WARNING]  
> Automated accessibility scans and expert heuristic reviews do not replace representative-user testing. Real users in context are required to validate this operational design.
