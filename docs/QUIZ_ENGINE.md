# Quiz Engine

## Quiz types

- Pre-test
- Post-test
- Practice quiz
- Topic quiz
- Remediation quiz

## Initial question types

- Single-best-answer multiple choice
- Multiple-response
- True or false
- Image-based multiple choice
- Ordered sequence

Possible later types:

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
- Required resource completion
- Availability dates
- Publication state

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
6. Prerequisites complete
7. Attempt limit not exceeded
8. Cooldown satisfied
9. No conflicting active attempt

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

Configurable:

- Show score only
- Show score and topic performance
- Show selected answers
- Show correct answers
- Show explanations
- Delay review until course end
- Never show correct answers

## Pre-test defaults

- One attempt
- Baseline measurement
- Score visible
- Correct answers hidden
- Does not usually block resources

## Post-test defaults

- Required resources complete
- Configurable passing score
- Default maximum three attempts
- Remediation after failure
- Answers and explanations configurable
- Certificate eligibility after passing

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
