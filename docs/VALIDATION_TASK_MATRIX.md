# Validation Task Matrix

| Role | Task ID | Task | Starting Point | Expected Destination | Expected Success Condition | Important Observation | Related Product Decision | Severity if Failed | Suggested Device |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Learner | L1 | Find physical-course date, time, venue | `/demo/learner/home` | `/demo/learner/home` (Cohort Card) | User reads correct logistics. | Do they look for a dashboard first? | Logistics on Home | High | Mobile |
| Learner | L2 | Find instructor and course contact | `/demo/learner/home` | `/demo/learner/home` or `/demo/learner/profile` | User identifies Instructor name. | Do they know who to call? | Physical course context | Medium | Mobile |
| Learner | L3 | Open Adult CPR guide | `/demo/learner/home` | `/demo/learner/guides/:resourceId` | User opens the specific guide. | Taps required to launch. | Organized by BLS topic | Critical | Mobile |
| Learner | L4 | Find a supporting video | `/demo/learner/guides` | `/demo/learner/guides/:resourceId` | User plays a video resource. | Do they use the type filter? | Fast launch priority | Medium | Mobile |
| Learner | L5 | Check pre-test status/availability | `/demo/learner/home` or `/demo/learner/quiz` | `/demo/learner/quiz` | User sees pre-test status. | Do they understand the deadline? | Pre-test requirement | Critical | Mobile |
| Learner | L6 | Determine post-test unavailability | `/demo/learner/quiz` | `/demo/learner/quiz` | User states the post-test release reason. | Do they think it's broken? | Post-test manual release | High | Mobile |
| Learner | L7 | Find latest quiz result | `/demo/learner/quiz` | `/demo/learner/quiz/result` | User locates score. | Do they look for a dedicated tab? | Results live in Quiz tab | Medium | Mobile |
| Learner | L8 | Interpret topic summary | `/demo/learner/quiz/result` | `/demo/learner/quiz/result` | User understands topic performance. | Do they ask for exact answers? | Answers remain hidden | High | Mobile |
| Learner | L9 | Locate historical cohort info | `/demo/learner/profile` | `/demo/learner/profile` | User finds past cohort details. | Is the current cohort clear? | Current vs historical state | Low | Mobile |
| Learner | L10 | Explain application nature | Any Learner Route | N/A | User recognizes it as a companion app. | Do they mention "modules"? | Not an LMS | Critical | Mobile |
| Instructor | I1 | Find next teaching session | `/demo/instructor/home` | `/demo/instructor/home` | User identifies session date/time. | Is it immediately visible? | Fast operational context | High | Mobile/Tablet |
| Instructor | I2 | Identify cohort/venue | `/demo/instructor/home` | `/demo/instructor/home` | User reads room and cohort. | Do they check assigned lists? | Contextual visibility | Medium | Mobile/Tablet |
| Instructor | I3 | Launch CPR demonstration video | `/demo/instructor/home` or `/demo/instructor/teaching-kit` | `/demo/instructor/teaching-kit/:resourceId` | User opens video quickly. | Taps required to launch. | Teaching Kit priority | Critical | Tablet |
| Instructor | I4 | Enter/exit presentation view | `/demo/instructor/teaching-kit/:resourceId` | `/demo/instructor/teaching-kit/:resourceId` | User enters and exits the in-page presentation view. | Does escape/close work naturally? | Reliable presentation | High | Tablet |
| Instructor | I5 | Find a teaching checklist | `/demo/instructor/teaching-kit` | `/demo/instructor/teaching-kit` | User locates a checklist resource. | Do they use type filters? | Resource variety | Medium | Mobile/Tablet |
| Instructor | I6 | Filter by teaching stage | `/demo/instructor/teaching-kit` | `/demo/instructor/teaching-kit` | User selects 'Opening' stage. | Do they understand the taxonomy? | Teaching stage organization | Medium | Mobile/Tablet |
| Instructor | I7 | Filter by topic or type | `/demo/instructor/teaching-kit` | `/demo/instructor/teaching-kit` | User selects specific topic/type. | Can they combine filters? | Flexible filtering | Medium | Mobile/Tablet |
| Instructor | I8 | Find an assigned cohort | `/demo/instructor/home` or `/demo/instructor/cohorts` | `/demo/instructor/cohorts` | User opens specific cohort. | Do they navigate away from Kit? | Assigned cohort scope | Low | Tablet |
| Instructor | I9 | Check learner pre-test status | `/demo/instructor/cohorts` | `/demo/instructor/cohorts` | User identifies completion status. | Do they expect to see scores? | Instructors see status only | High | Tablet |
| Instructor | I10 | Explain visible learner info | `/demo/instructor/cohorts` | N/A | User understands data boundaries. | Do they ask for learner answers? | Privacy boundaries | High | Tablet |
| Admin | A1 | Find a fictional learner | `/demo/admin/overview` | `/demo/admin/people` | User locates the learner record. | Do they use global search? | People management | High | Desktop |
| Admin | A2 | Identify cohort and status | `/demo/admin/people` | `/demo/admin/people` | User reads active/inactive state. | Is the status explicitly clear? | Clear status badges | Medium | Desktop |
| Admin | A3 | Use role and status filters | `/demo/admin/people` | `/demo/admin/people` | User filters for Active Instructors. | Are filters discoverable? | Administrative filtering | Medium | Desktop |
| Admin | A4 | Find cohort needing attention | `/demo/admin/overview` | `/demo/admin/overview` | User identifies flagged cohort. | Do they see the exception first? | Actionable exceptions | High | Desktop |
| Admin | A5 | Identify the specific issue | `/demo/admin/overview` | `/demo/admin/overview` | User states why it's flagged. | Do they know how to resolve it? | Clear error states | High | Desktop |
| Admin | A6 | Locate resource controls | Admin Nav | `/demo/admin/resources` | User discovers where to publish resources. | Is it distinct from Teaching Kit? | Admin discoverability | Medium | Desktop |
| Admin | A7 | Locate quiz controls | Admin Nav | `/demo/admin/quizzes` | User discovers where to edit quizzes. | Do they understand versions? | Content discoverability | Medium | Desktop |
| Admin | A8 | Review pre/post-test comparison | Admin Nav | `/demo/admin/results` | User reviews cohort metrics. | Do they rely only on the chart? | Data over decoration | Medium | Desktop |
| Admin | A9 | Locate tabular data alternative | `/demo/admin/results` | `/demo/admin/results` | User finds the exact data table. | Is the table easily accessible? | Accessibility requirements | High | Desktop |
| Admin | A10 | Find planned exports | `/demo/admin/results` | `/demo/admin/results` | User points to export buttons. | Do they expect a real download? | Prototype constraints | Medium | Desktop |
| Admin | A11 | Explain prototype boundaries | Any Admin Route | N/A | User differentiates fake vs real actions. | Do they trust the fictional data? | Explicit prototype boundaries | Critical | Desktop |
