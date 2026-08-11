import {
  ArrowRight,
  BookOpenText,
  CalendarCheck2,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router-dom";

import { CohortSummary } from "../../../components/common/cohort-summary";
import { PageHeader } from "../../../components/common/page-header";
import { ResourceRow } from "../../../components/common/resource-row";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function LearnerHomePage() {
  const learnerState = useRepositoryValue(
    prototypeRepository.getLearnerSnapshot,
  );
  const loadGuides = useCallback(
    () => prototypeRepository.listResources("learner"),
    [],
  );
  const guidesState = useRepositoryValue(loadGuides);

  if (learnerState.status === "loading" || guidesState.status === "loading") {
    return <StatePanel kind="loading" />;
  }

  if (learnerState.status === "error" || guidesState.status === "error") {
    return <StatePanel kind="error" />;
  }

  const learner = learnerState.data;
  const quickGuides = guidesState.data.filter((resource) =>
    learner.quickGuideIds.includes(resource.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        description="Your physical-course details, preparation and frequently used references."
        eyebrow="Learner home"
        title={`Hello, ${learner.profile.displayName.split(" ")[0]}`}
      />

      <section aria-labelledby="current-course-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Current cohort</p>
            <h2 className="text-xl font-bold" id="current-course-heading">
              Your upcoming BLS course
            </h2>
          </div>
          <Badge variant="info">
            <CalendarCheck2 aria-hidden="true" className="size-3.5" />
            Confirmed
          </Badge>
        </div>
        <CohortSummary cohort={learner.currentCohort} />
        <div className="mt-3 flex gap-3 rounded-xl border border-info/20 bg-info-soft p-4 text-info">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Prepare before arrival</h3>
            <p className="mt-1 text-sm">
              {learner.currentCohort.preparationNotes}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="quiz-action-heading"
        className="rounded-xl border bg-primary p-5 text-primary-foreground sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10"
          >
            <ClipboardCheck className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/75">
              Course preparation
            </p>
            <h2 className="mt-1 text-xl font-bold" id="quiz-action-heading">
              Pre-test completed
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Your score and topic summary are available. The post-test has not
              been released.
            </p>
          </div>
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/demo/learner/quiz">
              View quiz status
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="quick-guides-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">One-tap access</p>
            <h2 className="text-xl font-bold" id="quick-guides-heading">
              Quick guides
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link to="/demo/learner/guides">
              Browse all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          {quickGuides.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              to={`/demo/learner/guides/${resource.id}`}
            />
          ))}
        </div>
      </section>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenText aria-hidden="true" className="size-5 text-accent" />
            Companion, not an online course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Guides support your physical BLS course. They are references rather
            than modules, and opening them does not create completion progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
