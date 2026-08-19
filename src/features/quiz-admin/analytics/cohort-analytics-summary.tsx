import { CohortAggregateComparison } from "../data/quiz-analytics-repository";

interface Props {
  aggregate: CohortAggregateComparison;
}

export function CohortAnalyticsSummary({ aggregate }: Props) {
  const { totalLearners, pairedResultCount, preTest, postTest } = aggregate;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground">Learners</h3>
        <p className="mt-2 text-3xl font-bold">{totalLearners}</p>
        <p className="mt-1 text-sm text-muted-foreground">Enrolled learners</p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground">Pre-test completed</h3>
        <p className="mt-2 text-3xl font-bold">
          {preTest.completionCount} <span className="text-lg font-normal text-muted-foreground">/ {totalLearners}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalLearners > 0 ? Math.round((preTest.completionCount / totalLearners) * 100) + "% completion" : "—"}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground">Post-test completed</h3>
        <p className="mt-2 text-3xl font-bold">
          {postTest.completionCount} <span className="text-lg font-normal text-muted-foreground">/ {totalLearners}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalLearners > 0 ? Math.round((postTest.completionCount / totalLearners) * 100) + "% completion" : "—"}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground">Post-test passed</h3>
        <p className="mt-2 text-3xl font-bold">
          {postTest.passedCount} <span className="text-lg font-normal text-muted-foreground">/ {postTest.completionCount}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {postTest.completionCount > 0 ? Math.round((postTest.passedCount / postTest.completionCount) * 100) + "% pass rate" : "—"}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Paired results</h3>
        <p className="mt-2 text-2xl font-bold">{pairedResultCount}</p>
        <p className="mt-1 text-sm text-muted-foreground">Learners with both assessments submitted</p>
      </div>
    </div>
  );
}
