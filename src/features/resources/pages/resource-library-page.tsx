import { Search } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { FilterChips } from "../../../components/common/filter-chips";
import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useTranslation } from "../../../lib/i18n";
import { resourceLanguageKey, resourceTypeKey } from "../../../lib/i18n/enum-labels";
import { LiveResourceRow } from "../components/live-resource-row";
import { useResourceCatalog } from "../hooks/use-resources";
import type { ResourceLanguage, ResourceScope, ResourceType } from "../model/resource-types";

import {
  filterResources,
  languageOptions,
  normalizeLanguageParam,
  normalizeTypeParam,
  typeOptions,
} from "../model/resource-filter-utils";

export function ResourceLibraryPage({ scope }: { scope: ResourceScope }) {
  const { t } = useTranslation();
  const catalog = useResourceCatalog(scope);
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const topic = searchParams.get("topic") ?? "all";
  const stage = searchParams.get("stage") ?? "all";
  const type = normalizeTypeParam(searchParams.get("type"));
  const language = normalizeLanguageParam(searchParams.get("lang"));
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

  const filtered = useMemo(
    () => filterResources(catalog.data ?? [], query, topic, stage, type, language),
    [catalog.data, query, stage, topic, type, language],
  );

  const topicLabel = (value: string) => (value === "all" ? t("resource.library.allTopics") : topics.find(({ slug }) => slug === value)?.name ?? value);
  const stageLabel = (value: string) => (value === "all" ? t("resource.library.allStages") : stages.find(({ slug }) => slug === value)?.name ?? value);
  const typeLabel = (value: string) => (value === "all" ? t("resource.library.allTypes") : t(resourceTypeKey(value as ResourceType)));
  const languageLabel = (value: string) => (value === "all" ? t("resourceLanguage.all") : t(resourceLanguageKey(value as ResourceLanguage)));

  if (catalog.isPending) {
    return (
      <StatePanel
        kind="loading"
        title={instructor ? t("resource.library.loadingInstructor") : t("resource.library.loadingLearner")}
        description={t("resource.library.loadingDesc")}
      />
    );
  }

  if (catalog.isError) {
    const offline = !navigator.onLine;
    return (
      <StatePanel
        actionLabel={t("common.tryAgain")}
        description={offline ? t("resource.library.offlineDesc") : t("resource.library.errorDesc")}
        kind={offline ? "offline" : "error"}
        onAction={() => void catalog.refetch()}
        title={offline ? t("resource.library.offlineTitle") : t("resource.library.errorTitle")}
      />
    );
  }

  if (!catalog.data?.length) {
    return (
      <StatePanel
        kind="empty"
        title={instructor ? t("resource.library.emptyCatalogueInstructor") : t("resource.library.emptyCatalogueLearner")}
        description={t("resource.library.emptyCatalogueDesc")}
      />
    );
  }

  const basePath = instructor ? "/app/instructor/teaching-kit" : "/app/learner/guides";
  const grouped = instructor
    ? stages
        .map((group) => ({
          group,
          resources: filtered.filter((resource) => resource.teachingStages.some(({ id }) => id === group.id)),
        }))
        .filter(({ resources }) => resources.length)
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        description={instructor ? t("resource.library.instructorDesc") : t("resource.library.learnerDesc")}
        eyebrow={t("resource.library.eyebrow")}
        title={instructor ? t("resource.library.instructorTitle") : t("resource.library.learnerTitle")}
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 pt-5 sm:pt-6">
          <div>
            <label className="text-sm font-semibold" htmlFor="resource-search">
              {instructor ? t("resource.library.searchTeachingMaterials") : t("resource.library.searchGuides")}
            </label>
            <div className="relative mt-2">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                id="resource-search"
                onChange={(event) => setFilter("q", event.target.value, "")}
                placeholder={instructor ? t("resource.library.searchInstructorPlaceholder") : t("resource.library.searchLearnerPlaceholder")}
                type="search"
                value={query}
              />
            </div>
          </div>
          {instructor && (
            <div>
              <p className="mb-2 text-sm font-semibold">{t("resource.library.filterStage")}</p>
              <FilterChips
                getLabel={stageLabel}
                label={t("resource.library.filterStage")}
                onChange={(value) => setFilter("stage", value, "all")}
                options={["all", ...stages.map(({ slug }) => slug)]}
                value={stage}
              />
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">{t("resource.library.filterTopic")}</p>
              <FilterChips
                getLabel={topicLabel}
                label={t("resource.library.filterTopic")}
                onChange={(value) => setFilter("topic", value, "all")}
                options={["all", ...topics.map(({ slug }) => slug)]}
                value={topic}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("resource.library.filterType")}</p>
              <FilterChips
                getLabel={typeLabel}
                label={t("resource.library.filterType")}
                onChange={(value) => setFilter("type", value, "all")}
                options={typeOptions}
                value={type}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("resource.library.filterLanguage")}</p>
            <FilterChips
              getLabel={languageLabel}
              label={t("resource.library.filterLanguage")}
              onChange={(value) => setFilter("lang", value, "all")}
              options={languageOptions}
              value={language}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("resource.library.bookmarkNotice")}</p>
        </CardContent>
      </Card>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filtered.length} {instructor ? t("resource.library.countInstructor") : t("resource.library.countLearner")}{" "}
        {filtered.length === 1 ? t("resource.library.resource") : t("resource.library.resources")}
      </p>

      {filtered.length ? (
        instructor ? (
          <div className="space-y-6">
            {grouped.map(({ group, resources }) => (
              <section aria-labelledby={`stage-${group.slug}`} key={group.id}>
                <h2 className="mb-3 text-xl font-bold" id={`stage-${group.slug}`}>
                  {group.name}
                </h2>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {resources.map((resource) => (
                    <LiveResourceRow
                      contextLabel={resource.topics.map(({ name }) => name).join(", ")}
                      key={resource.id}
                      resource={resource}
                      to={`${basePath}/${resource.id}`}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section aria-labelledby="guide-results-heading">
            <h2 className="mb-3 text-xl font-bold" id="guide-results-heading">
              {t("resource.library.availableReferences")}
            </h2>
            <div className="overflow-hidden rounded-xl border bg-card">
              {filtered.map((resource) => (
                <LiveResourceRow key={resource.id} resource={resource} to={`${basePath}/${resource.id}`} />
              ))}
            </div>
          </section>
        )
      ) : (
        <StatePanel
          compact
          description={t("resource.library.emptyDesc")}
          kind="empty"
          title={t("resource.library.emptyTitle")}
        />
      )}
    </div>
  );
}
