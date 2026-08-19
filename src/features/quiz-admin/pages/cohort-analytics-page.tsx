import { useSearchParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { useCohorts } from "../../operations/hooks/use-operations";
import { ResultsNavigation } from "../../admin/components/results-navigation";
import {
  useCohortAggregateComparison,
  useCohortLearnerComparison,
  useCohortTopicComparison,
} from "../hooks/use-quiz-analytics";

import { CohortAnalyticsSummary } from "../analytics/cohort-analytics-summary";
import { ScoreComparison } from "../analytics/score-comparison";
import { TopicComparisonView } from "../analytics/topic-comparison";
import { LearnerComparisonTable } from "../analytics/learner-comparison-table";

export function AdminCohortAnalyticsPage() {
  const cohorts = useCohorts();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCohortId = searchParams.get("cohort") || "";

  const aggregateQuery = useCohortAggregateComparison(selectedCohortId);
  const learnerQuery = useCohortLearnerComparison(selectedCohortId);
  const topicQuery = useCohortTopicComparison(selectedCohortId);

  if (cohorts.isPending) return <StatePanel kind="loading" />;
  if (cohorts.isError) return <StatePanel kind="error" />;

  const activeCohorts = cohorts.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Pre-test and post-test comparison for this physical-course cohort."
        eyebrow="Administration"
        title="Cohort Analytics"
      />

      <ResultsNavigation />

      <div className="flex gap-4 items-center mb-6">
        <label className="text-sm font-semibold" htmlFor="cohort-select">
          Select cohort:
        </label>
        <select
          className="rounded-md border p-2 text-sm"
          id="cohort-select"
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              setSearchParams({ cohort: val });
            } else {
              setSearchParams({});
            }
          }}
          value={selectedCohortId}
        >
          <option value="">-- Choose a cohort --</option>
          {activeCohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {!selectedCohortId ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Please select a cohort to view analytics.
        </div>
      ) : (
        <div className="space-y-6">
          {aggregateQuery.isPending ? (
            <StatePanel kind="loading" />
          ) : aggregateQuery.isError ? (
            <StatePanel kind="error" />
          ) : aggregateQuery.data ? (
            <>
              {aggregateQuery.data.totalLearners === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                  This cohort has no enrolled learners.
                </div>
              ) : (
                <>
                  <CohortAnalyticsSummary aggregate={aggregateQuery.data} />
                  
                  {aggregateQuery.data.preTest.completionCount === 0 && aggregateQuery.data.postTest.completionCount === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                      No learners have submitted any assessments yet.
                    </div>
                  ) : (
                    <>
                      <ScoreComparison aggregate={aggregateQuery.data} />

                      {topicQuery.isPending ? (
                        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">Loading topics...</div>
                      ) : topicQuery.isError ? (
                        <div className="rounded-xl border p-6 text-center text-sm text-destructive">Failed to load topic comparison.</div>
                      ) : topicQuery.data ? (
                        <TopicComparisonView topics={topicQuery.data} />
                      ) : null}

                      {learnerQuery.isPending ? (
                        <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">Loading learners...</div>
                      ) : learnerQuery.isError ? (
                        <div className="rounded-xl border p-6 text-center text-sm text-destructive">Failed to load learner comparison.</div>
                      ) : learnerQuery.data ? (
                        <LearnerComparisonTable learners={learnerQuery.data} />
                      ) : null}
                    </>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
