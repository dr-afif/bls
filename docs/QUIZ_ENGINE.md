# Quiz Engine

## Quiz types

- Pre-test
- Post-test

Possible later quiz types:

- Practice quiz
- Topic quiz
- Remediation quiz

## Initial question types

- Single-best-answer multiple choice
- True or false

Possible later types:

- Multiple-response
- Image-based multiple choice
- Ordered sequence
- Matching
- Drag and drop
- Hotspot
- Branching scenario
- Timed clinical sequence

## Question fields

- Question text
- Type
- Optional media
- Answer options
- Correct answer
- Explanation
- Reference
- Difficulty
- Topic
- Learning objective
- Version
- Publication status
- Author
- Reviewer
- Review date
- Next review date

## Quiz configuration

- Quiz type
- Course
- Number of questions
- Fixed or randomized questions
- Randomized option order
- Passing score
- Time limit
- Attempt limit
- Cooldown
- Show score
- Show answers
- Show explanations
- Active account, effective course entitlement, and active learner cohort
- Manual post-test release by an assigned instructor or administrator
- Availability dates
- Publication state

Resource viewing or completion is not a quiz prerequisite. The product does
not use module-completion pathways; it supports a physical course.

## Attempt lifecycle

```text
eligible
  ↓
attempt created
  ↓
questions assigned and frozen
  ↓
answers autosaved
  ↓
submitted or timed out
  ↓
server-side scoring
  ↓
immutable result
  ↓
review according to policy
```

## Starting an attempt

Server-side checks:

1. User authenticated
2. Account active
3. Course entitlement active
4. Quiz published
5. Availability window valid
6. Attempt limit not exceeded
7. No conflicting active attempt

The backend then:

- Creates the attempt
- Selects questions
- Freezes question versions
- Freezes option order
- Sets server expiry
- Returns learner-safe question data

## Learner-safe payload

May include:

- Question identifier for attempt
- Question text
- Question media
- Answer options
- Display order
- Current saved answer

Must not include:

- `is_correct`
- Correct option identifier
- Scoring key
- Hidden explanation
- Item statistics that reveal the answer

## Autosave

- Save after response changes using debounce.
- Display saving state.
- Retry safe transient failures.
- Keep an unsent local copy only for the active attempt.
- Do not calculate correctness.
- Use an attempt-question identifier, not the original question identifier alone.

## Timer

- Server stores `started_at` and `expires_at`.
- Browser displays a countdown.
- Backend enforces expiry.
- Client clock is not authoritative.
- Submission after expiry is handled by policy.
- Refreshing the page should not reset the timer.

## Submission

Submission must:

- Be idempotent
- Check attempt state
- Check expiry
- Freeze answers
- Calculate correctness
- Calculate points
- Calculate percentage
- Determine pass or fail
- Record duration
- Mark attempt submitted
- Return a result consistent with review policy

## Review policy

MVP policy:

- Show score, pass/fail state, and topic performance when enabled for the
  published quiz version.
- Never show selected answers, correct answers, or explanations to learners.
- Instructors see assigned completion and permitted result summaries only.
- Detailed question-level review remains administrator-only.

## Pre-test defaults

- One attempt
- Baseline measurement
- Score visible
- Correct answers hidden
- Does not usually block resources

## Post-test defaults

- Configurable passing score
- One attempt by default; the administrator may configure up to ten
- Manual release after the physical course by an assigned instructor or
  administrator
- Score, pass/fail state, and topic summary only; answers remain hidden

## Historical integrity

- Attempt questions reference immutable question versions.
- Option order is frozen.
- Final answers are immutable.
- Published question edits create a new version.
- Historical reports use the attempt's actual version.

## Item analytics

### Difficulty

```text
number correct / number answered
```

### Learning gain

```text
post-test percentage - pre-test percentage
```

### Distractor analysis

Report:

- Selection frequency for each option
- Distractors never selected
- Distractors selected more often than correct answer
- Pre- versus post-test changes

### Discrimination

Later support point-biserial correlation or upper-lower group analysis.

## Administrative functions

- Create question
- Edit draft question
- Create new version
- Retire question
- Add topics
- Add difficulty
- Preview learner view
- Import questions
- Configure quiz rules
- Publish quiz
- Clone quiz
- View item analysis

The initial production authoring interface implements create, edit-draft,
version, publish, ordered quiz composition, and cohort release. Import, clone,
retirement, and item analysis remain deferred.
