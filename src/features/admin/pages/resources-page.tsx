import {
  CheckSquare2,
  FilePlus2,
  FileText,
  PlayCircle,
  Search,
  ScrollText,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

const resourceIcons = {
  guide: ScrollText,
  checklist: CheckSquare2,
  document: FileText,
  video: PlayCircle,
};

export function AdminResourcesPage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState("All audiences");
  const [notice, setNotice] = useState("");

  const resources = useMemo(() => {
    if (adminState.status !== "ready") return [];
    const normalizedQuery = query.trim().toLowerCase();
    return adminState.data.resources.filter((resource) => {
      const matchesQuery =
        !normalizedQuery ||
        `${resource.title} ${resource.topic} ${resource.teachingStage}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesAudience =
        audience === "All audiences" ||
        resource.audience.includes(
          audience === "Learners" ? "learner" : "instructor",
        );
      return matchesQuery && matchesAudience;
    });
  }, [adminState, audience, query]);

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            onClick={() =>
              setNotice("Prototype only: no resource record was created.")
            }
          >
            <FilePlus2 aria-hidden="true" />
            Add resource
          </Button>
        }
        description="Maintain fictional guides and teaching materials by audience, topic, stage and publication state."
        eyebrow="Administration"
        title="Resources"
      />

      <p aria-live="polite" className="text-sm text-info">
        {notice}
      </p>

      <Card className="shadow-none">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_14rem] sm:pt-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="resource-search">
              Search resources
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-10"
                id="resource-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, topic or teaching stage"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="resource-audience">
              Audience
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-sm"
              id="resource-audience"
              onChange={(event) => setAudience(event.target.value)}
              value={audience}
            >
              {["All audiences", "Learners", "Instructors"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {resources.length} {resources.length === 1 ? "resource" : "resources"}
      </p>

      {resources.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {resources.map((resource) => {
            const Icon = resourceIcons[resource.type];
            return (
              <div
                className="flex min-h-20 flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center"
                key={resource.id}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary"
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {resource.topic} · {resource.teachingStage}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{resource.type}</Badge>
                  <Badge variant="success">Published</Badge>
                  <Button
                    onClick={() =>
                      setNotice(
                        `Prototype only: ${resource.title} was not edited.`,
                      )
                    }
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <StatePanel
          compact
          description="Change the search or audience filter."
          kind="empty"
          title="No resources match"
        />
      )}
    </div>
  );
}

