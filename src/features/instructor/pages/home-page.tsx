import {
  ArrowRight,
  CalendarRange,
  Clock3,
  MapPin,
  PlayCircle,
  Users,
} from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { ResourceRow } from "../../../components/common/resource-row";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function InstructorHomePage() {
  const instructorState = useRepositoryValue(
    prototypeRepository.getInstructorSnapshot,
  );
  const loadResources = useCallback(
    () => prototypeRepository.listResources("instructor"),
    [],
  );
  const resourcesState = useRepositoryValue(loadResources);

  if (
    instructorState.status === "loading" ||
    resourcesState.status === "loading"
  ) {
    return <StatePanel kind="loading" />;
  }

  if (
    instructorState.status === "error" ||
    resourcesState.status === "error"
  ) {
    return <StatePanel kind="error" />;
  }

  const instructor = instructorState.data;
  const cohort = instructor.nextCohort;
  const recentResources = resourcesState.data.filter((resource) =>
    instructor.recentResourceIds.includes(resource.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        description="Your next physical session and launch-ready teaching materials."
        eyebrow="Instructor home"
        title={`Good morning, ${instructor.profile.displayName.split(" ")[1]}`}
      />

      <section
        aria-labelledby="next-session-heading"
        className="rounded-xl border bg-primary p-5 text-primary-foreground sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/70">Next session</p>
            <h2 className="mt-1 text-2xl font-bold" id="next-session-heading">
              {cohort.courseName}
            </h2>
            <p className="mt-1 text-sm text-white/75">
              {cohort.code} · {cohort.date}
            </p>
          </div>
          <Badge className="border-white/20 bg-white/10 text-white">
            Upcoming
          </Badge>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3">
            <Clock3 aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-sm">{cohort.time}</span>
          </div>
          <div className="flex gap-3">
            <MapPin aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-sm">{cohort.venue}</span>
          </div>
          <div className="flex gap-3">
            <Users aria-hidden="true" className="size-5 shrink-0" />
            <span className="text-sm">{cohort.learnerCount} learners</span>
          </div>
        </div>
        <Button asChild className="mt-6 bg-white text-primary hover:bg-white/90">
          <Link to="/demo/instructor/cohorts">
            Open cohort
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section aria-labelledby="start-teaching-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Rapid launch</p>
            <h2 className="text-xl font-bold" id="start-teaching-heading">
              Start teaching
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/demo/instructor/teaching-kit">
              Open Teaching Kit
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          {recentResources.map((resource) => (
            <ResourceRow
              contextLabel={resource.teachingStage}
              key={resource.id}
              resource={resource}
              to={`/demo/instructor/teaching-kit/${resource.id}`}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange aria-hidden="true" className="size-5 text-accent" />
              Cohort readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {cohort.preTestCompleted}/{cohort.learnerCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Learners have completed the pre-test
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle aria-hidden="true" className="size-5 text-accent" />
              Presentation-ready patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Instructor resources offer a local full-screen presentation view.
              No media or protected files are loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
