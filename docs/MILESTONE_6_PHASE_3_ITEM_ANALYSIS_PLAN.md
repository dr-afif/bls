# Milestone 6 Phase 3: Secure Question & Item Analysis Plan

## Objective
Provide administrators with useful question-level assessment analysis using secure server-owned aggregation over historical submitted attempts.

## Core Rules & Semantics
1. **Authoritative attempt rule**: Only `status='submitted'`, latest per learner, matching the exact `quiz_type`.
2. **Question-version identity rule**: `question_version_id` acts as the primary analytical item grouping. Grouping does not cross version boundaries.
3. **Response denominator**: Number of authoritative submitted attempts that actually contained that exact `question_version_id`.
4. **Correct-response formula**: `correct_response_count / response_count * 100` natively in SQL.
5. **Option-selection formula**: `selected_count / response_count * 100` natively in SQL.
6. **Distractor definition**: An incorrect option. 
7. **Private-scoring boundary**: Private scoring information must not be exposed directly.

## Backend
- **Migration**: A forward-only migration.
- **RPC**: `public.get_admin_cohort_item_analysis(target_cohort_id uuid, target_quiz_type public.quiz_type)` returning `jsonb`.
- **Indexes**: Will add if any performance advisor suggests for Phase 6.3.
- **Security**: `security definer`, `search_path=''`. Verifies `auth.uid()` and `private.is_admin_in_organization(target_cohort.organization_id)`. Revoked from anon/public.

## Historical Integrity
- **Frozen prompts**: Item analysis will use `attempt_questions.prompt_snapshot`.
- **Frozen option text**: Item analysis will use `attempt_question_options.option_text_snapshot`.
- **Version separation**: Distinct outputs per `question_version_id`.

## Administrator UI
- **Route**: `/app/admin/results/items`.
- **Navigation**: Extend `ResultsNavigation`.
- **Cohort Filter**: Retains `?cohort=<uuid>`.
- **Assessment Filter**: Adds `?assessment=<pre_test|post_test>`.
- **Item View**: Contains sample size context and warnings.
- **Option Distribution**: Visual display without judgmental coloration.

## Advanced Psychometrics (Excluded)
No discrimination index, point-biserial, reliability, or automated quality score calculations. No cross-cohort aggregation.

## Tests & Exit Criteria
- Complete pgTAP suite with role access boundaries.
- Zod parser test coverage.
- UI behavioral tests for empty state, navigation, and specific calculations.
- Clean standard checks (build, lint, typecheck, tests).
