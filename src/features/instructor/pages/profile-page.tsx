import {
  Building2,
  CalendarRange,
  FlaskConical,
  LogOut,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useDemoSession } from "../../demo/context/demo-session-context";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function InstructorProfilePage() {
  const instructorState = useRepositoryValue(
    prototypeRepository.getInstructorSnapshot,
  );
  const { resetDemo } = useDemoSession();

  if (instructorState.status === "loading") return <StatePanel kind="loading" />;
  if (instructorState.status === "error") return <StatePanel kind="error" />;

  const instructor = instructorState.data;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Fictional instructor details, teaching assignments and prototype controls."
        eyebrow="Instructor"
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
                {instructor.profile.initials}
              </span>
              <div>
                <CardTitle>{instructor.profile.displayName}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {instructor.profile.roleTitle}
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
                <dd className="mt-1 font-semibold">{instructor.profile.email}</dd>
              </div>
              <div className="rounded-xl border p-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 aria-hidden="true" className="size-4" />
                  Organization
                </dt>
                <dd className="mt-1 font-semibold">
                  {instructor.profile.organization}
                </dd>
              </div>
              <div className="rounded-xl border p-4 sm:col-span-2">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarRange aria-hidden="true" className="size-4" />
                  Teaching assignments
                </dt>
                <dd className="mt-1 font-semibold">
                  {instructor.assignedCohorts.length} fictional cohort records
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
              <Link to="/demo/instructor/states">
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

      <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          No authenticated instructor account, real learner roster or
          authorization boundary exists in this prototype.
        </p>
      </div>
    </div>
  );
}

