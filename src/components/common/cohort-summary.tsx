import { CalendarDays, Clock3, Mail, MapPin, UserRound } from "lucide-react";

import type { DemoCohort } from "../../features/prototype/data/types";
import { Badge } from "../ui/badge";

type CohortSummaryProps = {
  cohort: DemoCohort;
  compact?: boolean;
};

const cohortStatus = {
  upcoming: { label: "Upcoming", variant: "info" },
  "in-progress": { label: "In progress", variant: "primary" },
  completed: { label: "Completed", variant: "success" },
  "needs-attention": { label: "Needs attention", variant: "warning" },
} as const;

export function CohortSummary({
  cohort,
  compact = false,
}: CohortSummaryProps) {
  const status = cohortStatus[cohort.status];

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            {cohort.code}
          </p>
          <h2 className="mt-1 text-lg font-bold">{cohort.courseName}</h2>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <dl className="grid gap-x-6 gap-y-4 p-4 text-sm sm:grid-cols-2 sm:p-5">
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-4" />
            Date
          </dt>
          <dd className="mt-1 font-semibold">{cohort.date}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-4" />
            Time
          </dt>
          <dd className="mt-1 font-semibold">{cohort.time}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <MapPin aria-hidden="true" className="size-4" />
            Venue
          </dt>
          <dd className="mt-1 font-semibold">{cohort.venue}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted-foreground">
            <UserRound aria-hidden="true" className="size-4" />
            Instructor
          </dt>
          <dd className="mt-1 font-semibold">{cohort.instructor}</dd>
        </div>
        {!compact && (
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Mail aria-hidden="true" className="size-4" />
              Course contact
            </dt>
            <dd className="mt-1 font-semibold">{cohort.contact}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

