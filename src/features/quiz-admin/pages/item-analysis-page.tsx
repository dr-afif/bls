import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { useCohorts } from "../../operations/hooks/use-operations";
import { ResultsNavigation } from "../../admin/components/results-navigation";
import { useCohortItemAnalysis } from "../hooks/use-quiz-analytics";
import { ItemAnalysisTable } from "../analytics/item-analysis-table";

export function AdminItemAnalysisPage() {
  const cohorts = useCohorts();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCohortId = searchParams.get("cohort") || "";
  const selectedAssessment = (searchParams.get("assessment") as "pre_test" | "post_test") || "pre_test";

  const analysisQuery = useCohortItemAnalysis(selectedCohortId, selectedAssessment);

  if (cohorts.isPending) return <StatePanel kind="loading" />;
  if (cohorts.isError) return <StatePanel kind="error" />;

  const activeCohorts = cohorts.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Question-level analysis of assessment attempts."
        eyebrow="Administration"
        title="Item Analysis"
      />

      <ResultsNavigation />

      <div className="flex gap-4 items-center mb-6 bg-muted/50 p-4 rounded-lg">
        <div className="flex flex-col gap-1.5 w-1/3">
          <label className="text-sm font-semibold" htmlFor="cohort-select">
            Select cohort:
          </label>
          <select
            className="rounded-md border p-2 text-sm bg-background"
            id="cohort-select"
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                if (val) p.set("cohort", val);
                else p.delete("cohort");
                return p;
              });
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

        <div className="flex flex-col gap-1.5 w-1/3">
          <label className="text-sm font-semibold" htmlFor="assessment-select">
            Assessment:
          </label>
          <select
            className="rounded-md border p-2 text-sm bg-background"
            id="assessment-select"
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                if (val) p.set("assessment", val);
                return p;
              });
            }}
            value={selectedAssessment}
            disabled={!selectedCohortId}
          >
            <option value="pre_test">Pre-Test</option>
            <option value="post_test">Post-Test</option>
          </select>
        </div>
      </div>

      {!selectedCohortId ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Please select a cohort to view item analysis.
        </div>
      ) : (
        <div className="space-y-6">
          {analysisQuery.isPending ? (
            <StatePanel kind="loading" />
          ) : analysisQuery.isError ? (
            <StatePanel kind="error" />
          ) : analysisQuery.data ? (
            <>
              {analysisQuery.data.analyzedLearnerCount === 0 ? (
                <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                  No submitted attempts found for this assessment.
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center rounded-lg border bg-blue-50/50 p-4 text-sm text-blue-900 border-blue-100">
                    <div>
                      <strong>Context:</strong> Based on the latest submitted attempt for {analysisQuery.data.analyzedLearnerCount} learner{analysisQuery.data.analyzedLearnerCount !== 1 ? 's' : ''}.
                    </div>
                  </div>
                  <ItemAnalysisTable analysis={analysisQuery.data} />
                </>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
