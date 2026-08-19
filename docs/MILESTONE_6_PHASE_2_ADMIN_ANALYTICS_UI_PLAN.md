# Milestone 6 Phase 2: Administrator Cohort Analytics UI

## Objective
Provide administrator cohort-level pre/post analytics using the Phase 6.1 secure reporting foundation. 
Administrators will be able to view learner completions, pre-test and post-test score comparisons, topic learning gains, and paired learner-level data.

## Information architecture
- **Operational Results (`/app/admin/results`)**: The existing cohort overview focusing on granular access and individual attempt actions.
- **Cohort Analytics (`/app/admin/results/analytics`)**: The new analytics workspace.
- **Local Navigation**: A shared `ResultsNavigation` tabs component connects both workspaces.
- **Cohort Persistence**: The cohort selection uses URL search parameters (`?cohort=<uuid>`) so it is preserved across tabs and history.
- **Historical cohorts**: Completed physical cohorts can be analyzed natively through the selector.

## UI Components
1. **Summary metrics**: Displays enrollment count, pre-test completion count/percentage, post-test completion count/percentage, post-test passed count/percentage, and paired results count.
2. **Score comparison**: A bar chart-like visualization comparing pre-test vs. post-test mean accuracy and total paired learning gain in percentage points.
3. **Topic comparison**: A detailed view that graphs the pre-test and post-test accuracy of each topic across the entire cohort (response-weighted) with learning gains.
4. **Learner comparison**: A comprehensive table showing each learner's pre-test score, post-test score, learning gain, and direct links to their detailed attempt submissions.

## Statistical semantics
- **Server-owned means**: `averageScorePercent` provided by the server.
- **Server-owned medians**: `medianScorePercent` provided by the server.
- **Paired learning gain**: Handled entirely by the server based on paired results. Always labeled using "percentage points" or "pp".
- **Response-weighted topic accuracy**: Calculated safely on the server across all scored responses for a topic, not an average of learner averages.
- **Missing-value behaviour**: All missing or zero-attempt assessments return `null` dynamically. The UI renders this safely as "Not available", "Not submitted", or "—" rather than an accidental `0%`.

## Accessibility
- **Chart/table alternatives**: Data tables support the charts with accessible `<caption>`s.
- **Keyboard navigation**: Links and buttons use native tab focusing and active classes.
- **Focus**: Maintains app-wide standardized focus handling without trapping.
- **Responsive tables**: Tables utilize scrollable horizontal overflow wrappers to avoid destroying the layout on narrow viewports.
- **Non-colour-only communication**: Indicators such as "+" alongside success/destructive textual colors are leveraged to convey learning gains inclusively.

## Security/data boundary
- **Administrator reporting RPCs only**: The UI solely utilizes `get_admin_cohort_aggregate_comparison`, `get_admin_cohort_topic_comparison`, and `get_admin_cohort_learner_comparison`.
- **No raw answers**: The browser never retrieves, exposes, or scores individual answers or keys for analytical derivation.
- **No browser-side sensitive aggregate calculation**: All metrics like standard deviations, medians, or means are explicitly calculated in the secure Postgres boundary.

## Deferred
The following features are purposefully omitted from Phase 6.2 and reserved for later milestone increments:
- **Question/item analysis**: Item-level or distractor analysis is not part of this release.
- **CSV exports**: Administrator raw-data export functionality is deferred.
- **Production hardening**: Final optimization and performance audits for release remain deferred until all MVP scopes are resolved.

## Verification and exit criteria
- **Rendered functionality**: The new analytics UI renders cleanly on all viewports without crashing.
- **No data recalculation**: UI purely binds the retrieved server variables without running mapping math on arrays.
- **Automated test coverage**: Dedicated behaviour and state verification tests pass.
- **Consistent database**: Phase 6.1 RPC contracts remain authoritative and stable.
