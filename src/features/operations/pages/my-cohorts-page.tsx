import { CalendarClock, MapPin, Phone, Users } from "lucide-react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { InstructorCohortReadiness } from "../components/instructor-cohort-readiness";
import { OperationState } from "../components/operation-state";
import { useCohorts } from "../hooks/use-operations";

export function MyCohortsPage({ instructor = false }: { instructor?: boolean }) {
  const cohorts = useCohorts();
  if (cohorts.isPending || cohorts.isError) return <OperationState query={cohorts} />;
  if (!cohorts.data?.length) return <OperationState emptyTitle={instructor ? "No assigned cohorts" : "No current course assignment"} query={{ isPending: false, isError: false, refetch: cohorts.refetch }} />;

  return (
    <div className="space-y-6">
      <PageHeader description={instructor ? "Physical-course schedules and permitted roster information for your assigned cohorts." : "Your permitted physical-course schedule, venue, contact, and preparation information."} eyebrow="Live development workspace" title={instructor ? "Assigned cohorts" : "My course"} />
      <div className="grid gap-4">
        {cohorts.data.map((cohort) => {
          const learnerCount = cohort.members.filter((member) => member.memberRole === "learner").length;
          return (
          <Card className="shadow-none" key={cohort.id}>
            <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><Badge variant="info">{cohort.status}</Badge><CardTitle className="mt-3">{cohort.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{cohort.code}</p></div></div></CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="flex gap-3"><CalendarClock aria-hidden="true" className="size-5 text-primary" /><div><dt className="text-muted-foreground">Schedule</dt><dd className="font-semibold">{new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date(cohort.startAt))}</dd></div></div>
                <div className="flex gap-3"><MapPin aria-hidden="true" className="size-5 text-primary" /><div><dt className="text-muted-foreground">Venue</dt><dd className="font-semibold">{cohort.venue || "To be confirmed"}</dd></div></div>
                <div className="flex gap-3"><Phone aria-hidden="true" className="size-5 text-primary" /><div><dt className="text-muted-foreground">Course contact</dt><dd className="font-semibold">{cohort.contactName || "Course operations"}{cohort.contactPhone ? ` · ${cohort.contactPhone}` : ""}</dd></div></div>
                {instructor && <div className="flex gap-3"><Users aria-hidden="true" className="size-5 text-primary" /><div><dt className="text-muted-foreground">Permitted roster</dt><dd className="font-semibold">{learnerCount} {learnerCount === 1 ? "learner" : "learners"}</dd></div></div>}
              </dl>
              {cohort.preparationNotes && <div className="rounded-xl bg-primary-soft p-4"><h2 className="font-semibold text-primary">Preparation</h2><p className="mt-1 text-sm text-primary">{cohort.preparationNotes}</p></div>}
              {instructor && <InstructorCohortReadiness cohortId={cohort.id} />}
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
