import {
  Building2,
  CalendarDays,
  FlaskConical,
  LogOut,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useDemoSession } from "../../demo/context/demo-session-context";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function LearnerProfilePage() {
  const learnerState = useRepositoryValue(
    prototypeRepository.getLearnerSnapshot,
  );
  const { resetDemo } = useDemoSession();

  if (learnerState.status === "loading") return <StatePanel kind="loading" />;
  if (learnerState.status === "error") return <StatePanel kind="error" />;

  const learner = learnerState.data;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Fictional participant details, cohort history and prototype controls."
        eyebrow="Learner"
        title="Profile"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground"
              >
                {learner.profile.initials}
              </span>
              <div>
                <CardTitle>{learner.profile.displayName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {learner.profile.roleTitle}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail aria-hidden="true" className="size-4" />
                  Demo email
                </dt>
                <dd className="mt-1 font-semibold">{learner.profile.email}</dd>
              </div>
              <div className="rounded-xl border p-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 aria-hidden="true" className="size-4" />
                  Organization
                </dt>
                <dd className="mt-1 font-semibold">
                  {learner.profile.organization}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Prototype controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/demo/learner/states">
                <FlaskConical aria-hidden="true" />
                View system states
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-start"
              onClick={resetDemo}
              variant="ghost"
            >
              <Link to="/">
                <LogOut aria-hidden="true" />
                Change demo role
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="cohort-history-heading">
        <h2 className="text-xl font-bold" id="cohort-history-heading">
          Cohort records
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <div className="flex min-h-16 items-center gap-3 border-b px-4 py-3">
            <CalendarDays
              aria-hidden="true"
              className="size-5 shrink-0 text-primary"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{learner.currentCohort.code}</p>
              <p className="text-sm text-muted-foreground">
                {learner.currentCohort.date}
              </p>
            </div>
            <Badge variant="info">Current</Badge>
          </div>
          {learner.historicalCohorts.map((cohort) => (
            <div
              className="flex min-h-16 items-center gap-3 px-4 py-3"
              key={cohort.id}
            >
              <CalendarDays
                aria-hidden="true"
                className="size-5 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{cohort.code}</p>
                <p className="text-sm text-muted-foreground">{cohort.date}</p>
              </div>
              <Badge variant="success">Historical</Badge>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          No account, authentication or real personal information exists in
          this frontend-only prototype.
        </p>
      </div>
    </div>
  );
}
