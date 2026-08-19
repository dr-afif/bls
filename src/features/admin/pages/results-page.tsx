import { Link, useSearchParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { useCohorts } from "../../operations/hooks/use-operations";
import { useAdminQuizResults } from "../../quiz-admin/hooks/use-quiz-staff";
import { ResultsNavigation } from "../components/results-navigation";

export function AdminResultsPage() {
  const cohorts = useCohorts();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCohortId = searchParams.get("cohort") || "";

  const results = useAdminQuizResults(selectedCohortId);

  if (cohorts.isPending) return <StatePanel kind="loading" />;
  if (cohorts.isError) return <StatePanel kind="error" />;

  const activeCohorts = cohorts.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        description="View assessment results for learners across all assigned cohorts."
        eyebrow="Administration"
        title="Results"
      />

      <ResultsNavigation />

      <div className="flex gap-4 items-center">
        <label className="text-sm font-semibold" htmlFor="cohort-select">Select cohort:</label>
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
          {activeCohorts.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>

      {selectedCohortId ? (
        <div className="rounded-xl border bg-card p-6">
          {results.isPending ? (
            <StatePanel kind="loading" />
          ) : results.isError ? (
            <StatePanel kind="error" />
          ) : results.data && results.data.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <thead className="bg-muted/65">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Learner</th>
                    <th className="px-4 py-3 font-semibold">Quiz Title</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Score</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.data.map((attempt) => (
                    <tr key={attempt.attemptId}>
                      <th className="px-4 py-3 font-semibold" scope="row">{attempt.learnerName}</th>
                      <td className="px-4 py-3">{attempt.quizTitle}</td>
                      <td className="px-4 py-3 capitalize">{attempt.quizType.replace("_", " ")}</td>
                      <td className="px-4 py-3 capitalize">{attempt.status.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        {attempt.status === "submitted" ? (
                          <span className={attempt.passed ? "text-success font-semibold" : "text-destructive font-semibold"}>
                            {attempt.scorePercent}% {attempt.passed ? "(Pass)" : "(Fail)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/app/admin/results/${attempt.attemptId}`}>
                            View Detail
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No quiz attempts found for this cohort.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Please select a cohort to view results.
        </div>
      )}
    </div>
  );
}
