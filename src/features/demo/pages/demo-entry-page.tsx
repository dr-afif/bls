import {
  ArrowRight,
  LockKeyhole,
  MonitorSmartphone,
  Search,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { DemoBanner } from "../../../components/common/demo-banner";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useDemoSession } from "../context/demo-session-context";
import { demoRoleLabels } from "../model/demo-role";
import { DemoRoleSelector } from "../components/demo-role-selector";

const prototypeHighlights = [
  {
    icon: MonitorSmartphone,
    title: "Role-aware",
    description: "Distinct learner, instructor and administrator experiences.",
  },
  {
    icon: Search,
    title: "Resource-first",
    description: "Frequently used guides and teaching materials stay close.",
  },
  {
    icon: UsersRound,
    title: "Course companion",
    description: "Built around cohorts and physical BLS course delivery.",
  },
];

const roleEntryPath = {
  learner: "/demo/learner/home",
  instructor: "/demo/instructor/home",
  administrator: "/demo/admin/overview",
} as const;

export function DemoEntryPage() {
  const { role, setRole } = useDemoSession();

  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary-soft/60"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <AppLogo />
          <DemoBanner />
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.12fr_0.88fr] lg:py-16">
          <section className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Basic Life Support companion
            </p>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              Practical support for every physical BLS course.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Explore a frontend-only course companion for learners,
              instructors and administrators. Every name, cohort, result and
              resource is fictional.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {prototypeHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex gap-3 sm:block" key={item.title}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <div className="sm:mt-3">
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex max-w-xl items-start gap-3 rounded-2xl border border-info/20 bg-info-soft p-4 text-sm text-info">
              <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <p>
                <strong>Prototype boundary:</strong> authentication, protected
                resources, post-test release enforcement and secure quiz
                scoring are not implemented.
              </p>
            </div>
          </section>

          <Card className="mx-auto w-full max-w-xl shadow-lift">
            <CardHeader>
              <CardTitle>Enter the prototype</CardTitle>
              <CardDescription>
                Select a role to open its distinct prototype experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DemoRoleSelector onChange={setRole} value={role} />
              <Button asChild className="mt-6 w-full" size="lg">
                <Link to={roleEntryPath[role]}>
                  Open as {demoRoleLabels[role]}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No account is created and no data leaves this browser session.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
