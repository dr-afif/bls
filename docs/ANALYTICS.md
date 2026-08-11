# Analytics

## Objectives

- Measure learner engagement.
- Measure course completion.
- Compare pre- and post-test performance.
- Identify difficult topics and weak questions.
- Identify users requiring intervention.
- Support cohort and organization reporting.
- Maintain privacy and scope boundaries.

## Core metrics

### User metrics

- Registered users
- Verified users
- Active users
- Pending users
- Suspended users
- Expired users
- Access expiring soon

### Course metrics

- Enrolments
- Course starts
- Resource starts
- Resource completions
- Course completions
- Completion rate
- Median completion time
- Drop-off point

### Assessment metrics

- Pre-test mean and median
- Post-test mean and median
- Mean learning gain
- Pass rate
- Attempts per learner
- Time per attempt
- Topic performance
- Question difficulty
- Distractor use
- Question discrimination

### Resource metrics

- Video start rate
- Video completion rate
- Average watched percentage
- PDF open rate
- Page-view completion
- Average reading time
- Most frequently abandoned resources

## Event catalogue

- `user_signed_in`
- `course_opened`
- `resource_opened`
- `resource_completed`
- `video_started`
- `video_completed`
- `pdf_started`
- `pdf_completed`
- `quiz_started`
- `quiz_submitted`
- `quiz_passed`
- `quiz_failed`
- `course_completed`
- `certificate_issued`

Do not record every mouse movement or scroll event.

## Learning gain

```text
post-test percentage - pre-test percentage
```

Report:

- Individual change
- Mean cohort change
- Median cohort change
- Distribution
- Percentage improved
- Percentage unchanged
- Percentage declined

## Question analysis

### Difficulty

```text
correct responses / total valid responses
```

### Distractor analysis

For each option:

- Number selected
- Percentage selected
- Pre-test selection
- Post-test selection

### Discrimination

Add after sufficient sample size.

## Dashboard design

### Admin summary

- Active learners
- Completion rate
- Pass rate
- Expiring access
- Learners needing attention

### Charts

- Completion trend
- Enrollment trend
- Learning-gain distribution
- Topic performance
- Pass or fail by cohort
- Completion funnel

### Tables

- Learner progress
- Resource engagement
- Question analysis
- Expiring access
- Failed attempts
- Audit events

## Filters

- Date range
- Organization
- Cohort
- Course
- Quiz
- User status
- Entitlement status
- Profession or department where permitted

## Reporting

Exports:

- User access report
- Course completion report
- Pre- and post-test comparison
- Individual learner report
- Question-analysis report
- Cohort summary
- Audit report

Initial export format:

- CSV

Later:

- Server-generated PDF

## Privacy

Define:

- Who may view individual-level data
- Whether instructors see only assigned cohorts
- Whether IP or device data is retained
- Event-retention period
- Aggregation schedule
- Account-deletion treatment
- Certificate-retention treatment
- Audit-retention period

## Performance

- Use server-side filters.
- Use pagination.
- Use aggregate views.
- Consider daily summary tables.
- Avoid client-side processing of large event tables.
- Archive high-volume raw events according to policy.

## Data quality

Exclude or flag:

- Invalidated attempts
- Test accounts
- Incomplete timed-out attempts where appropriate
- Duplicate submission retries
- Retired course versions when comparing incompatible content
