import {
  Database,
  FlaskConical,
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
      "Future production controls for learner, instructor and administrator access.",
  },
  {
    icon: Database,
    title: "Data and retention",
    description:
      "Future persistence, retention and export configuration for real records.",
  },
  {
    icon: ShieldCheck,
    title: "Quiz and review policy",
    description:
      "Future controls for secure release, answer review and explanations.",
  },
];

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Production configuration placeholders with explicit frontend-only boundaries."
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
                <Badge className="mt-4">Deferred to production MVP</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-warning/25 bg-warning-soft shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <FlaskConical aria-hidden="true" className="size-5" />
            Frontend prototype settings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-warning">
          <p className="text-sm">
            No settings are persisted. Supabase, authentication, RLS, protected
            storage and secure scoring are intentionally absent.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
