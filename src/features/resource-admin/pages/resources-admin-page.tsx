import { FilePlus2, Search, Tags } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { localizedText, useTranslation } from "../../../lib/i18n";
import {
  resourceAudienceKey,
  resourceLanguageKey,
  resourceStatusKey,
  resourceTypeKey,
} from "../../../lib/i18n/enum-labels";
import { ResourceAdminState, ResourceStatusBadge } from "../components/resource-admin-ui";
import { useAdminResourceCatalog } from "../hooks/use-admin-resources";
import { selectClassName } from "../model/resource-admin-form-utils";
import type { ResourceAudience, ResourceStatus, ResourceType } from "../model/resource-admin-types";

const statusFilterOptions: ResourceStatus[] = [
  "draft",
  "under_review",
  "approved",
  "published",
  "retired",
  "archived",
];

const typeFilterOptions: ResourceType[] = ["guide", "checklist", "pdf", "youtube_video"];

export function ResourcesAdminPage() {
  const { t, locale } = useTranslation();
  const catalog = useAdminResourceCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all";
  const type = searchParams.get("type") ?? "all";
  const audience = searchParams.get("audience") ?? "all";
  const topic = searchParams.get("topic") ?? "all";
  const stage = searchParams.get("stage") ?? "all";

  const setFilter = (name: string, value: string, defaultValue = "all") =>
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === defaultValue) next.delete(name);
      else next.set(name, value);
      return next;
    }, { replace: true });

  const filtered = useMemo(
    () =>
      (catalog.data?.resources ?? []).filter((resource) => {
        const matchesSearch = `${resource.title} ${resource.slug} ${resource.courseTitle} ${resource.courseTitleMs ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return (
          matchesSearch &&
          (status === "all" || resource.status === status) &&
          (type === "all" || resource.type === type) &&
          (audience === "all" || resource.audiences.includes(audience as ResourceAudience)) &&
          (topic === "all" || resource.topics.some((item) => item.id === topic)) &&
          (stage === "all" || resource.stages.some((item) => item.id === stage))
        );
      }),
    [audience, catalog.data?.resources, search, stage, status, topic, type],
  );

  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/app/admin/resources/taxonomy">
                <Tags aria-hidden="true" />
                {t("resourceAdmin.resources.manageTaxonomy")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/admin/resources/new">
                <FilePlus2 aria-hidden="true" />
                {t("resourceAdmin.resources.newResource")}
              </Link>
            </Button>
          </div>
        }
        description={t("resourceAdmin.resources.description")}
        eyebrow="Live development workspace"
        title={t("resourceAdmin.resources.title")}
      />
      <section aria-label="Resource filters" className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-semibold md:col-span-2 xl:col-span-1">
          {t("resourceAdmin.resources.searchLabel")}
          <span className="relative mt-2 block">
            <Search aria-hidden="true" className="absolute left-3 top-3 size-5 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(event) => setFilter("q", event.target.value, "")}
              placeholder={t("resourceAdmin.resources.searchPlaceholder")}
              type="search"
              value={search}
            />
          </span>
        </label>
        <label className="text-sm font-semibold">
          {t("common.status")}
          <select className={selectClassName} onChange={(event) => setFilter("status", event.target.value)} value={status}>
            <option value="all">{t("resourceAdmin.resources.allStatuses")}</option>
            {statusFilterOptions.map((value) => (
              <option key={value} value={value}>
                {t(resourceStatusKey(value))}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("resource.library.filterType")}
          <select className={selectClassName} onChange={(event) => setFilter("type", event.target.value)} value={type}>
            <option value="all">{t("resourceAdmin.resources.allTypes")}</option>
            {typeFilterOptions.map((value) => (
              <option key={value} value={value}>
                {t(resourceTypeKey(value))}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("resourceAdmin.resources.audiences")}
          <select className={selectClassName} onChange={(event) => setFilter("audience", event.target.value)} value={audience}>
            <option value="all">{t("resourceAdmin.resources.allAudiences")}</option>
            <option value="learner">{t("resourceAudience.learner")}</option>
            <option value="instructor">{t("resourceAudience.instructor")}</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("resource.library.filterTopic")}
          <select className={selectClassName} onChange={(event) => setFilter("topic", event.target.value)} value={topic}>
            <option value="all">{t("resourceAdmin.resources.allTopics")}</option>
            {catalog.data?.topics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.active ? "" : ` (${t("resourceAdmin.resources.inactive")})`}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          {t("resource.library.filterStage")}
          <select className={selectClassName} onChange={(event) => setFilter("stage", event.target.value)} value={stage}>
            <option value="all">{t("resourceAdmin.resources.allStages")}</option>
            {catalog.data?.stages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.active ? "" : ` (${t("resourceAdmin.resources.inactive")})`}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2 xl:col-span-3">
          {t("resourceAdmin.resources.bookmarkNotice")}
        </p>
      </section>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Showing {filtered.length} of {catalog.data?.resources.length ?? 0} {t("resourceAdmin.resources.showingCount")}.
      </p>
      {catalog.data?.resources.length === 0 ? (
        <ResourceAdminState empty query={catalog} />
      ) : filtered.length === 0 ? (
        <StatePanel
          compact
          kind="empty"
          title={t("resourceAdmin.resources.emptyFilteredTitle")}
          description={t("resourceAdmin.resources.emptyFilteredDesc")}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((resource) => {
            const courseTitle = localizedText({ en: resource.courseTitle, ms: resource.courseTitleMs, locale });
            return (
              <article className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5" key={resource.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ResourceStatusBadge status={resource.status} />
                      <Badge variant="neutral">{t(resourceTypeKey(resource.type))}</Badge>
                      <Badge variant="neutral">{t(resourceLanguageKey(resource.contentLanguage))}</Badge>
                      {resource.featured && <Badge variant="primary">{t("resource.featured")}</Badge>}
                    </div>
                    <h2 className="mt-3 text-lg font-bold">
                      <Link
                        className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        to={`/app/admin/resources/${resource.id}`}
                      >
                        {resource.title}
                      </Link>
                    </h2>
                    <p className="mt-1 break-all text-sm text-muted-foreground">
                      {resource.slug} · {courseTitle}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/app/admin/resources/${resource.id}`}>
                      {t("resourceAdmin.resources.manageResource")}
                    </Link>
                  </Button>
                </div>
                <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold">{t("resourceAdmin.resources.audiences")}</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {resource.audiences.map((aud) => t(resourceAudienceKey(aud))).join(", ") || t("resourceAdmin.resources.notAssigned")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("resourceAdmin.resources.topics")}</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {resource.topics.map((item) => `${item.name}${item.active ? "" : ` (${t("resourceAdmin.resources.inactive")})`}`).join(", ") || t("resourceAdmin.resources.notAssigned")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("resourceAdmin.resources.versions")}</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {resource.versions.length} {t("resourceAdmin.resources.total")}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
