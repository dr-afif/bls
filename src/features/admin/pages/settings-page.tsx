import {
  Database,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

const settingsAreas = [
  {
    icon: KeyRound,
    title: "Authentication and roles",
    description:
      "Operational controls for learner, instructor and administrator access.",
  },
  {
    icon: Database,
    title: "Data and retention",
    description:
      "Persistence, retention and export configuration for operational records.",
  },
  {
    icon: ShieldCheck,
    title: "Quiz and review policy",
    description:
      "Controls for secure post-test release, answer review and score verification.",
  },
];

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="System environment and operational controls for BLS Course Companion."
        eyebrow="Administration"
        title="Settings"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {settingsAreas.map((area) => {
          const Icon = area.icon;
          return (
            <Card className="shadow-none" key={area.title}>
              <CardHeader>
                <span
                  aria-hidden="true"
                  className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <CardTitle>{area.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {area.description}
                </p>
                <Badge className="mt-4">Upcoming controls</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
            System Environment & Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="text-sm">
            Core authentication, row-level security, role-based authorization,
            and audited reporting are actively enforced. Granular administrative
            policy configuration and retention preferences will be available in
            upcoming releases.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
