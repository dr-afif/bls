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

export function GuidesPage() {
  const loadResources = useCallback(
    () => prototypeRepository.listResources("learner"),
    [],
  );
  const resourcesState = useRepositoryValue(loadResources);
  const [query, setQuery] = useState("");
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
        `${resource.title} ${resource.summary} ${resource.topic}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesTopic =
        topic === "All topics" || resource.topic === topic;
      const matchesType =
        typeMap[type] === null || resource.type === typeMap[type];
      return matchesQuery && matchesTopic && matchesType;
    });
  }, [query, resourcesState, topic, type]);

  if (resourcesState.status === "loading") return <StatePanel kind="loading" />;
  if (resourcesState.status === "error") return <StatePanel kind="error" />;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Find practical BLS references by topic or resource type. Guides are never gated by completion."
        eyebrow="Clinical field guide"
        title="Guides"
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="guide-search">
              Search guides
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-10"
                id="guide-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search CPR, AED, airway…"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">BLS topic</p>
            <FilterChips
              label="Filter by BLS topic"
              onChange={setTopic}
              options={topicOptions}
              value={topic}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Resource type</p>
            <FilterChips
              label="Filter by resource type"
              onChange={setType}
              options={typeOptions}
              value={type}
            />
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="guide-results-heading">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold" id="guide-results-heading">
            Available references
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {filteredResources.length}{" "}
            {filteredResources.length === 1 ? "result" : "results"}
          </p>
        </div>
        {filteredResources.length ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            {filteredResources.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                to={`/demo/learner/guides/${resource.id}`}
              />
            ))}
          </div>
        ) : (
          <StatePanel
            compact
            description="Try a different topic, resource type, or search term."
            kind="empty"
            title="No guides match these filters"
          />
        )}
      </section>
    </div>
  );
}
