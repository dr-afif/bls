import { Search } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { FilterChips } from "../../../components/common/filter-chips";
import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { LiveResourceRow } from "../components/live-resource-row";
import { useResourceCatalog } from "../hooks/use-resources";
import type { CourseResource, ResourceScope, ResourceType } from "../model/resource-types";

const typeOptions = ["All types", "Guide", "Checklist", "Document", "Video"] as const;
const typeByLabel: Record<(typeof typeOptions)[number], ResourceType | null> = {
  "All types": null,
  Guide: "guide",
  Checklist: "checklist",
  Document: "pdf",
  Video: "youtube_video",
};

function filterResources(resources: CourseResource[], query: string, topic: string, stage: string, type: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const selectedType = typeByLabel[type as keyof typeof typeByLabel] ?? null;
  return resources.filter((resource) => {
    const searchable = [resource.title, resource.summary, ...resource.topics.map(({ name }) => name), ...resource.teachingStages.map(({ name }) => name)].join(" ").toLowerCase();
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (topic === "all" || resource.topics.some(({ slug }) => slug === topic))
      && (stage === "all" || resource.teachingStages.some(({ slug }) => slug === stage))
      && (!selectedType || resource.type === selectedType);
  });
}

export function ResourceLibraryPage({ scope }: { scope: ResourceScope }) {
  const catalog = useResourceCatalog(scope);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const topic = searchParams.get("topic") ?? "all";
  const stage = searchParams.get("stage") ?? "all";
  const type = searchParams.get("type") ?? "All types";
  const instructor = scope === "instructor";

  const setFilter = (name: string, value: string, defaultValue: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === defaultValue || !value) next.delete(name);
      else next.set(name, value);
      return next;
    }, { replace: true });
  };

  const topics = useMemo(() => {
    const unique = new Map(catalog.data?.flatMap((resource) => resource.topics).map((item) => [item.slug, item]) ?? []);
    return [...unique.values()].sort((left, right) => left.displayOrder - right.displayOrder);
  }, [catalog.data]);
  const stages = useMemo(() => {
    const unique = new Map(catalog.data?.flatMap((resource) => resource.teachingStages).map((item) => [item.slug, item]) ?? []);
    return [...unique.values()].sort((left, right) => left.displayOrder - right.displayOrder);
  }, [catalog.data]);
  const filtered = useMemo(() => filterResources(catalog.data ?? [], query, topic, stage, type), [catalog.data, query, stage, topic, type]);
  const topicLabel = (value: string) => value === "all" ? "All topics" : topics.find(({ slug }) => slug === value)?.name ?? value;
  const stageLabel = (value: string) => value === "all" ? "All stages" : stages.find(({ slug }) => slug === value)?.name ?? value;

  if (catalog.isPending) return <StatePanel kind="loading" title={instructor ? "Loading Teaching Kit" : "Loading Guides"} description="Checking your course access and available materials." />;
  if (catalog.isError) {
    const offline = !navigator.onLine;
    return <StatePanel actionLabel="Try again" description={offline ? "Reconnect to load protected course materials." : "Check your connection and try again. No data was changed."} kind={offline ? "offline" : "error"} onAction={() => void catalog.refetch()} title={offline ? "Course materials require a connection" : "Course materials are unavailable"} />;
  }
  if (!catalog.data?.length) return <StatePanel kind="empty" title={instructor ? "No teaching materials are available" : "No guides are available"} description="Your account is active, but no published resources are currently available for this course." />;

  const basePath = instructor ? "/app/instructor/teaching-kit" : "/app/learner/guides";
  const grouped = instructor
    ? stages.map((group) => ({ group, resources: filtered.filter((resource) => resource.teachingStages.some(({ id }) => id === group.id)) })).filter(({ resources }) => resources.length)
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        description={instructor ? "Launch permitted materials by physical-course stage, BLS topic, or resource type." : "Find permitted practical BLS references by topic or resource type. Resources are not a completion pathway."}
        eyebrow="Live development resources"
        title={instructor ? "Teaching Kit" : "Guides"}
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="resource-search">Search {instructor ? "teaching materials" : "guides"}</label>
            <div className="relative mt-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" id="resource-search" onChange={(event) => setFilter("q", event.target.value, "")} placeholder={instructor ? "Search guides, videos, checklists…" : "Search CPR, AED, airway…"} type="search" value={query} />
            </div>
          </div>
          {instructor && <div><p className="mb-2 text-sm font-semibold">Teaching stage</p><FilterChips getLabel={stageLabel} label="Filter by teaching stage" onChange={(value) => setFilter("stage", value, "all")} options={["all", ...stages.map(({ slug }) => slug)]} value={stage} /></div>}
          <div className="grid gap-5 lg:grid-cols-2">
            <div><p className="mb-2 text-sm font-semibold">BLS topic</p><FilterChips getLabel={topicLabel} label="Filter by BLS topic" onChange={(value) => setFilter("topic", value, "all")} options={["all", ...topics.map(({ slug }) => slug)]} value={topic} /></div>
            <div><p className="mb-2 text-sm font-semibold">Resource type</p><FilterChips label="Filter by resource type" onChange={(value) => setFilter("type", value, "All types")} options={typeOptions} value={type as (typeof typeOptions)[number]} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Filter selections are reflected in the URL so this view can be bookmarked. Topic and stage names come from live development data.</p>
        </CardContent>
      </Card>

      <p aria-live="polite" className="text-sm text-muted-foreground">{filtered.length} {instructor ? "launch-ready" : "available"} {filtered.length === 1 ? "resource" : "resources"}</p>

      {filtered.length ? (
        instructor ? <div className="space-y-6">{grouped.map(({ group, resources }) => <section aria-labelledby={`stage-${group.slug}`} key={group.id}><h2 className="mb-3 text-xl font-bold" id={`stage-${group.slug}`}>{group.name}</h2><div className="overflow-hidden rounded-xl border bg-card">{resources.map((resource) => <LiveResourceRow contextLabel={resource.topics.map(({ name }) => name).join(", ")} key={resource.id} resource={resource} to={`${basePath}/${resource.id}`} />)}</div></section>)}</div>
        : <section aria-labelledby="guide-results-heading"><h2 className="mb-3 text-xl font-bold" id="guide-results-heading">Available references</h2><div className="overflow-hidden rounded-xl border bg-card">{filtered.map((resource) => <LiveResourceRow key={resource.id} resource={resource} to={`${basePath}/${resource.id}`} />)}</div></section>
      ) : <StatePanel compact description="Try a different topic, teaching stage, resource type, or search term." kind="empty" title="No resources match these filters" />}
    </div>
  );
}
