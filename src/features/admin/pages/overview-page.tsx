import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  FilePlus2,
  Info,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

const attentionIcons = {
  warning: AlertTriangle,
  destructive: XCircle,
  info: Info,
};

const attentionClasses = {
  warning: "text-warning",
  destructive: "text-destructive",
  info: "text-info",
};

export function AdminOverviewPage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  const admin = adminState.data;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Upcoming physical courses, operational exceptions and rapid administration shortcuts."
        eyebrow="Course operations"
        title="Overview"
      />

      <section aria-labelledby="admin-actions-heading">
        <h2 className="mb-3 text-lg font-bold" id="admin-actions-heading">
          Common actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button asChild className="justify-start" variant="outline">
            <Link to="/demo/admin/people">
              <UserPlus aria-hidden="true" />
              Add or find a person
            </Link>
          </Button>
          <Button asChild className="justify-start" variant="outline">
            <Link to="/demo/admin/cohorts">
              <CalendarRange aria-hidden="true" />
              Create a cohort
            </Link>
          </Button>
          <Button asChild className="justify-start" variant="outline">
            <Link to="/demo/admin/resources">
              <FilePlus2 aria-hidden="true" />
              Add a resource
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Upcoming cohorts</CardTitle>
              <Badge variant="info">
                <CalendarRange aria-hidden="true" className="size-3.5" />
                {admin.upcomingCohorts.length} scheduled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-xl border">
              {admin.upcomingCohorts.map((cohort) => (
                <Link
                  className="group flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-muted"
                  key={cohort.id}
                  to="/demo/admin/cohorts"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
                  >
                    <Users className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{cohort.code}</span>
                    <span className="block text-sm text-muted-foreground">
                      {cohort.date} · {cohort.learnerCount} people
                    </span>
                  </span>
                  <Badge
                    variant={
                      cohort.status === "needs-attention" ? "warning" : "info"
                    }
                  >
                    {cohort.status === "needs-attention"
                      ? "Needs attention"
                      : "Ready"}
                  </Badge>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Requires attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-xl border">
              {admin.attentionItems.map((item) => {
                const Icon = attentionIcons[item.tone];
                return (
                  <div className="flex min-h-20 gap-3 px-4 py-3" key={item.id}>
                    <Icon
                      aria-hidden="true"
                      className={`mt-0.5 size-5 shrink-0 ${attentionClasses[item.tone]}`}
                    />
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="readiness-heading">
        <h2 className="mb-3 text-lg font-bold" id="readiness-heading">
          Quiz readiness
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {admin.upcomingCohorts.map((cohort) => (
            <div className="rounded-xl border bg-card p-4" key={cohort.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{cohort.code}</p>
                <Badge>{cohort.preTestCompleted}/{cohort.learnerCount}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Pre-test completion · Post-test{" "}
                {cohort.postTestReleased ? "released" : "not released"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
