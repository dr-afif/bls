import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FilterChips } from "../../../components/common/filter-chips";
import { PageHeader } from "../../../components/common/page-header";
import { ResourceRow } from "../../../components/common/resource-row";
import { StatePanel } from "../../../components/common/state-panel";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import type {
  DemoResource,
  DemoResourceType,
} from "../../prototype/data/types";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

const stageOptions = [
  "All stages",
  "Opening",
  "Recognition",
  "Skills practice",
  "Scenario and debrief",
] as const;

const topicOptions = [
  "All topics",
  "Recognition",
  "Adult CPR",
  "Airway",
  "AED",
  "Recovery",
] as const;

const typeOptions = [
  "All types",
  "Guide",
  "Checklist",
  "Document",
  "Video",
] as const;

const typeMap: Record<(typeof typeOptions)[number], DemoResourceType | null> = {
  "All types": null,
  Guide: "guide",
  Checklist: "checklist",
  Document: "document",
  Video: "video",
};

export function TeachingKitPage() {
  const loadResources = useCallback(
    () => prototypeRepository.listResources("instructor"),
    [],
  );
  const resourcesState = useRepositoryValue(loadResources);
  const [query, setQuery] = useState("");
  const [stage, setStage] =
    useState<(typeof stageOptions)[number]>("All stages");
  const [topic, setTopic] =
    useState<(typeof topicOptions)[number]>("All topics");
  const [type, setType] =
    useState<(typeof typeOptions)[number]>("All types");

  const filteredResources = useMemo(() => {
    if (resourcesState.status !== "ready") return [] as DemoResource[];

    const normalizedQuery = query.trim().toLowerCase();
    return resourcesState.data.filter((resource) => {
      const matchesQuery =
        !normalizedQuery ||
        `${resource.title} ${resource.summary} ${resource.topic} ${resource.teachingStage}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStage =
        stage === "All stages" || resource.teachingStage === stage;
      const matchesTopic =
        topic === "All topics" || resource.topic === topic;
      const matchesType =
        typeMap[type] === null || resource.type === typeMap[type];
      return matchesQuery && matchesStage && matchesTopic && matchesType;
    });
  }, [query, resourcesState, stage, topic, type]);

  if (resourcesState.status === "loading") return <StatePanel kind="loading" />;
  if (resourcesState.status === "error") return <StatePanel kind="error" />;

  const groupedResources = stageOptions
    .filter((option) => option !== "All stages")
    .map((group) => ({
      group,
      resources: filteredResources.filter(
        (resource) => resource.teachingStage === group,
      ),
    }))
    .filter((group) => group.resources.length);

  return (
    <div className="space-y-7">
      <PageHeader
        description="Find and launch materials by physical-course stage, BLS topic or resource type."
        eyebrow="Instructor field guide"
        title="Teaching Kit"
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="kit-search">
              Search teaching materials
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-10"
                id="kit-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search slides, videos, checklists…"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Teaching stage</p>
            <FilterChips
              label="Filter by teaching stage"
              onChange={setStage}
              options={stageOptions}
              value={stage}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">BLS topic</p>
              <FilterChips
                label="Filter teaching kit by topic"
                onChange={setTopic}
                options={topicOptions}
                value={topic}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Resource type</p>
              <FilterChips
                label="Filter teaching kit by resource type"
                onChange={setType}
                options={typeOptions}
                value={type}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filteredResources.length} launch-ready{" "}
        {filteredResources.length === 1 ? "resource" : "resources"}
      </p>

      {groupedResources.length ? (
        <div className="space-y-6">
          {groupedResources.map((group) => (
            <section
              aria-labelledby={`stage-${group.group.replaceAll(" ", "-")}`}
              key={group.group}
            >
              <h2
                className="mb-3 text-xl font-bold"
                id={`stage-${group.group.replaceAll(" ", "-")}`}
              >
                {group.group}
              </h2>
              <div className="overflow-hidden rounded-xl border bg-card">
                {group.resources.map((resource) => (
                  <ResourceRow
                    contextLabel={resource.topic}
                    key={resource.id}
                    resource={resource}
                    to={`/demo/instructor/teaching-kit/${resource.id}`}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <StatePanel
          compact
          description="Try a different teaching stage, topic, type or search term."
          kind="empty"
          title="No teaching materials match"
        />
      )}
    </div>
  );
}
