import { LockOpen } from "lucide-react";
import { useState } from "react";

import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { useInstructorReadiness, useReleasePostTest } from "../../quiz-admin/hooks/use-quiz-staff";

export function InstructorCohortReadiness({ cohortId }: { cohortId: string }) {
  const readiness = useInstructorReadiness(cohortId);
  const releaseMutation = useReleasePostTest();
  const [releaseError, setReleaseError] = useState("");

  if (readiness.isPending || readiness.isError) {
    return <div className="mt-6"><StatePanel kind={readiness.isPending ? "loading" : "error"} /></div>;
  }

  if (!readiness.data || readiness.data.length === 0) {
    return (
      <div className="mt-6 rounded-xl border p-4 text-center text-sm text-muted-foreground">
        No learners assigned to this cohort.
      </div>
    );
  }

  const learners = readiness.data;
  const postTestAvailable = learners.length > 0 && learners[0].postTest.quizId;
  const postTestReleased = learners.some(l => l.postTest.released);

  const handleRelease = async () => {
    setReleaseError("");
    const quizId = learners[0].postTest.quizId;
    if (!quizId) return;
    try {
      await releaseMutation.mutateAsync({ cohortId, quizId, requestId: crypto.randomUUID() });
    } catch {
      setReleaseError("Failed to release post-test. Please try again.");
    }
  };

  return (
    <div className="mt-6 space-y-4 border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Assessment Readiness</h3>
          {releaseError && <p className="text-sm text-destructive mt-1">{releaseError}</p>}
        </div>
        {postTestAvailable && !postTestReleased && (
          <Button 
            disabled={releaseMutation.isPending} 
            onClick={handleRelease}
          >
            <LockOpen aria-hidden="true" className="mr-2 size-4" />
            Release Post-Test
          </Button>
        )}
        {postTestReleased && (
          <div className="text-sm font-medium text-success flex items-center gap-2">
            <LockOpen aria-hidden="true" className="size-4" /> Post-Test Released
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="bg-muted/65">
            <tr>
              <th className="px-4 py-3 font-semibold">Learner</th>
              <th className="px-4 py-3 font-semibold">Pre-Test Status</th>
              <th className="px-4 py-3 font-semibold">Post-Test Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {learners.map((learner) => (
              <tr key={learner.learnerId}>
                <th className="px-4 py-3 font-semibold" scope="row">{learner.learnerName}</th>
                <td className="px-4 py-3">
                  {!learner.preTest.available ? <span className="text-muted-foreground">N/A</span> :
                    <span className="capitalize">{learner.preTest.status.replace("_", " ")}</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {!learner.postTest.released ? <span className="text-muted-foreground">Locked</span> :
                    <span className="capitalize">{learner.postTest.status.replace("_", " ")}</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
