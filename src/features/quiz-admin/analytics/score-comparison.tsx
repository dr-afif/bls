import { CohortAggregateComparison } from "../data/quiz-analytics-repository";

interface Props {
  aggregate: CohortAggregateComparison;
}

export function ScoreComparison({ aggregate }: Props) {
  const { preTest, postTest, averageLearningGain } = aggregate;

  const hasPre = preTest.averageScorePercent !== null;
  const hasPost = postTest.averageScorePercent !== null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Pre-test vs post-test</h3>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-sm">Pre-test mean</span>
              <span className="font-bold">{hasPre ? `${preTest.averageScorePercent}%` : "Not available"}</span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
              {hasPre && (
                <div
                  className="h-full bg-primary"
                  style={{ width: `${preTest.averageScorePercent}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium text-sm">Post-test mean</span>
              <span className="font-bold">{hasPost ? `${postTest.averageScorePercent}%` : "Not available"}</span>
            </div>
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
              {hasPost && (
                <div
                  className="h-full bg-primary"
                  style={{ width: `${postTest.averageScorePercent}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Change</h4>
            <p className="text-2xl font-bold">
              {averageLearningGain !== null ? (
                <span className={averageLearningGain >= 0 ? "text-success" : "text-destructive"}>
                  {averageLearningGain > 0 ? "+" : ""}{averageLearningGain} <span className="text-sm font-normal text-muted-foreground">percentage points</span>
                </span>
              ) : (
                <span className="text-muted-foreground text-sm font-normal">
                  Learning gain is not available until at least one learner has submitted both assessments.
                </span>
              )}
            </p>
            {averageLearningGain !== null && (
              <p className="text-xs text-muted-foreground mt-2">
                Change compares paired submitted pre-test and post-test scores. It is descriptive and does not establish causation.
              </p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Score Details</h4>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm border-collapse">
              <caption className="sr-only">Detailed cohort score comparison</caption>
              <thead className="bg-muted/65">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">Measure</th>
                  <th scope="col" className="px-4 py-2 font-semibold text-right">Pre-test</th>
                  <th scope="col" className="px-4 py-2 font-semibold text-right">Post-test</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <th scope="row" className="px-4 py-2 font-medium">Mean</th>
                  <td className="px-4 py-2 text-right">{hasPre ? `${preTest.averageScorePercent}%` : "—"}</td>
                  <td className="px-4 py-2 text-right">{hasPost ? `${postTest.averageScorePercent}%` : "—"}</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-2 font-medium">Median</th>
                  <td className="px-4 py-2 text-right">{preTest.medianScorePercent !== null ? `${preTest.medianScorePercent}%` : "—"}</td>
                  <td className="px-4 py-2 text-right">{postTest.medianScorePercent !== null ? `${postTest.medianScorePercent}%` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
