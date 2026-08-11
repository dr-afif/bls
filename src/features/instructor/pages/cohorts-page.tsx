import { CheckCircle2, Info, UserRound, XCircle } from "lucide-react";

import { CohortSummary } from "../../../components/common/cohort-summary";
import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function InstructorCohortsPage() {
  const instructorState = useRepositoryValue(
    prototypeRepository.getInstructorSnapshot,
  );

  if (instructorState.status === "loading") return <StatePanel kind="loading" />;
  if (instructorState.status === "error") return <StatePanel kind="error" />;

  const instructor = instructorState.data;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Assigned physical-course details and permitted pre-test readiness information."
        eyebrow="Instructor"
        title="Cohorts"
      />

      <section aria-labelledby="assigned-cohort-heading">
        <h2 className="mb-3 text-xl font-bold" id="assigned-cohort-heading">
          Next assigned cohort
        </h2>
        <CohortSummary cohort={instructor.nextCohort} />
      </section>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Pre-test readiness</CardTitle>
            <Badge variant="info">
              {instructor.nextCohort.preTestCompleted}/
              {instructor.nextCohort.learnerCount} complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Learner names and pre-test completion status for BLS-2608
              </caption>
              <thead className="bg-muted/65">
                <tr>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Learner
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Pre-test status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {instructor.assignedLearners.map((learner) => (
                  <tr key={learner.id}>
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <UserRound
                          aria-hidden="true"
                          className="size-4 text-muted-foreground"
                        />
                        {learner.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          learner.preTestStatus === "Completed"
                            ? "success"
                            : "warning"
                        }
                      >
                        {learner.preTestStatus === "Completed" ? (
                          <CheckCircle2
                            aria-hidden="true"
                            className="size-3.5"
                          />
                        ) : (
                          <XCircle aria-hidden="true" className="size-3.5" />
                        )}
                        {learner.preTestStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3 rounded-xl bg-info-soft p-4 text-info">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm">
              Individual answers are intentionally not shown. Names and
              completion states are fictional and are not protected by real
              authorization in this prototype.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

