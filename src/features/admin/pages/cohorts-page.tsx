import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  MapPin,
  Save,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function AdminCohortsPage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);
  const [showEditor, setShowEditor] = useState(false);
  const [notice, setNotice] = useState("");

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button onClick={() => setShowEditor(true)}>
            <CalendarPlus aria-hidden="true" />
            Create cohort
          </Button>
        }
        description="Schedule physical courses, assign instructors and review fictional membership readiness."
        eyebrow="Administration"
        title="Cohorts"
      />

      <p aria-live="polite" className="text-sm text-info">
        {notice}
      </p>

      {showEditor && (
        <Card className="border-primary/25 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Local presentation only
                </p>
                <CardTitle className="mt-1">Create cohort</CardTitle>
              </div>
              <Button
                aria-label="Close cohort editor"
                onClick={() => setShowEditor(false)}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                setNotice("Prototype only: cohort details were not saved.");
                setShowEditor(false);
              }}
            >
              <div>
                <label className="text-sm font-semibold" htmlFor="cohort-code">
                  Cohort code
                </label>
                <Input defaultValue="BLS-2612" id="cohort-code" />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="cohort-date">
                  Course date
                </label>
                <Input defaultValue="2026-08-22" id="cohort-date" type="date" />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="cohort-time">
                  Start time
                </label>
                <Input defaultValue="08:30" id="cohort-time" type="time" />
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="cohort-venue">
                  Venue
                </label>
                <Input
                  defaultValue="Clinical Skills Centre"
                  id="cohort-venue"
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold"
                  htmlFor="cohort-instructor"
                >
                  Instructor
                </label>
                <select
                  className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-sm"
                  defaultValue=""
                  id="cohort-instructor"
                >
                  <option disabled value="">
                    Select instructor
                  </option>
                  <option>Dr Sara Lim</option>
                  <option>Dr Nadia Tan</option>
                </select>
              </div>
              <div>
                <label
                  className="text-sm font-semibold"
                  htmlFor="cohort-members"
                >
                  Learner places
                </label>
                <Input defaultValue="24" id="cohort-members" min="1" type="number" />
              </div>
              <div className="flex flex-wrap gap-3 border-t pt-4 sm:col-span-2">
                <Button type="submit">
                  <Save aria-hidden="true" />
                  Preview save
                </Button>
                <Button
                  onClick={() => setShowEditor(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {adminState.data.upcomingCohorts.map((cohort) => (
          <div className="rounded-xl border bg-card p-4 sm:p-5" key={cohort.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{cohort.code}</h2>
                  <Badge
                    variant={
                      cohort.status === "needs-attention" ? "warning" : "info"
                    }
                  >
                    {cohort.status === "needs-attention"
                      ? "Needs attention"
                      : "Upcoming"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cohort.courseName}
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-3 lg:min-w-[40rem]">
                <div className="flex gap-2">
                  <Clock3
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <dt className="text-muted-foreground">Schedule</dt>
                    <dd className="font-semibold">
                      {cohort.date} · {cohort.time}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <dt className="text-muted-foreground">Venue</dt>
                    <dd className="font-semibold">{cohort.venue}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Users
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <dt className="text-muted-foreground">Readiness</dt>
                    <dd className="font-semibold">
                      {cohort.preTestCompleted}/{cohort.learnerCount} pre-tests
                    </dd>
                  </div>
                </div>
              </dl>
              <Button
                onClick={() =>
                  setNotice(
                    `Prototype only: opened ${cohort.code} editing presentation.`,
                  )
                }
                variant="outline"
              >
                <CheckCircle2 aria-hidden="true" />
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

