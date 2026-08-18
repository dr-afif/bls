# Milestone 6 Phase 1: Secure Reporting & Analytics Foundation

## Objective
Create the secure server-owned reporting layer that later Milestone 6 phases will use for cohort pre-test/post-test comparison, operational assessment readiness, learner-level pre/post comparison, cohort learning-gain summaries, and topic-level comparisons.

## Product Rules & Constraints
- **Backend-owned reporting**: Reporting authorization and aggregate semantics must be calculated on the backend using `security definer` RPCs.
- **Strict authorization**: Instructors and learners must not have access to these admin analytics RPCs.
- **Attempt-selection policy**: Use the learner's final (most recent) submitted eligible attempt according to the quiz definition. Never combine results from unrelated quiz definitions.
- **Learning Gain**: Defined as `post-test percentage - pre-test percentage`. Missing assessments must return `null`.
- **No raw data exposure**: Do not make the browser download raw datasets to calculate aggregates itself.
- **Out of scope**: No UI, charts, CSV exports, or production hardening in this phase.

## 1. Deterministic Attempt-Selection Rule
When summarizing data for pre-test vs. post-test comparisons, the backend will identify the **authoritative attempt** for a learner for a given quiz (pre or post) by selecting the most recently submitted attempt:

```sql
SELECT DISTINCT ON (learner_id, quiz_id) *
FROM public.quiz_attempts
WHERE cohort_id = target_cohort_id
  AND quiz_id = target_quiz_id
  AND status = 'submitted'
ORDER BY learner_id, quiz_id, submitted_at DESC
```

## 2. Proposed RPC Contracts

### 2.1 Learner Pre/Post Comparison
**RPC**: `public.get_admin_cohort_learner_comparison(target_cohort_id uuid)`
**Purpose**: Returns a learner-by-learner comparison of pre-test and post-test scores and learning gain.

```typescript
type LearnerComparison = {
  learnerId: string;
  learnerName: string;
  preTest: {
    attemptId: string | null;
    scorePercent: number | null;
    submittedAt: string | null;
  };
  postTest: {
    attemptId: string | null;
    scorePercent: number | null;
    submittedAt: string | null;
  };
  learningGain: number | null; // postTest.scorePercent - preTest.scorePercent
}[];
```

### 2.2 Cohort Aggregate Comparison
**RPC**: `public.get_admin_cohort_aggregate_comparison(target_cohort_id uuid)`
**Purpose**: Returns the overall cohort averages for pre-test, post-test, and overall learning gain.

```typescript
type CohortAggregateComparison = {
  preTest: {
    averageScorePercent: number | null;
    completionCount: number;
    totalLearners: number;
  };
  postTest: {
    averageScorePercent: number | null;
    completionCount: number;
    totalLearners: number;
  };
  averageLearningGain: number | null;
};
```

### 2.3 Cohort Topic-Level Comparison
**RPC**: `public.get_admin_cohort_topic_comparison(target_cohort_id uuid)`
**Purpose**: Returns aggregate performance by topic, allowing administrators to identify specific areas of improvement.

```typescript
type TopicComparison = {
  topicId: string;
  topicName: string;
  preTest: {
    correctCount: number;
    totalQuestions: number;
    averagePercent: number | null;
  };
  postTest: {
    correctCount: number;
    totalQuestions: number;
    averagePercent: number | null;
  };
  learningGain: number | null;
}[];
```

## 3. Database Implementation & Security
- All new RPCs will be created in `supabase/migrations/20260818120000_milestone_6_analytics_foundation.sql` (or similar timestamp).
- Functions will be `language plpgsql stable security definer set search_path = ''`.
- Access will be guarded by checking `private.is_admin_in_organization()`.
- Execute grants will be restricted to `authenticated` and `service_role`.
- `anon` and `public` roles will have execution revoked.

## 4. Verification Plan (pgTAP)
- **Authorization**: Verify `anonymous`, `learner`, and `instructor` are denied execution/access.
- **Cross-Organization**: Verify administrators cannot query cohorts in other organizations.
- **Accuracy**: Seed a specific cohort with known pre/post attempts and verify the exact math of `learningGain` (including null cases when an attempt is missing).
- **Selection**: Verify that if a learner has multiple submitted pre-test attempts, only the latest one is used in aggregations.

## 5. Next Actions
Upon approval of this plan, I will:
1. Implement the database migration for these reporting RPCs.
2. Implement the pgTAP tests for security and accuracy.
3. Apply the migration and verify tests against the hosted fictional database.
4. Add the frontend TypeScript repository methods and hooks.
