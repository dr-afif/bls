import { Activity, ArrowLeft, Eye, FilePlus2, RotateCcw, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { StatePanel } from "../../../components/common/state-panel";
import { localizedText, useTranslation } from "../../../lib/i18n";
import {
  resourceAudienceKey,
  resourceLanguageKey,
  resourceTypeKey,
} from "../../../lib/i18n/enum-labels";
import { ResourceAdminState, ResourceStatusBadge } from "../components/resource-admin-ui";
import { useAdminResourceCatalog, useAdminResourceMutations } from "../hooks/use-admin-resources";
import { selectClassName } from "../model/resource-admin-form-utils";
import type { ResourceAudience, ResourceLanguage } from "../model/resource-admin-types";

const contentLanguageOptions: ResourceLanguage[] = ["en", "ms", "bilingual", "language_independent"];

export function ResourceDetailPage() {
  const { t, locale, formatDateTime } = useTranslation();
  const { resourceId = "" } = useParams();
  const catalog = useAdminResourceCatalog();
  const mutations = useAdminResourceMutations();
  const [notice, setNotice] = useState("");

  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  const resource = catalog.data?.resources.find((item) => item.id === resourceId);
  if (!resource) {
    return (
      <StatePanel
        as="h1"
        kind="error"
        title={t("resource.viewer.notFoundTitle")}
        description={t("resource.viewer.notFoundDesc")}
      />
    );
  }

  const courseTitle = localizedText({ en: resource.courseTitle, ms: resource.courseTitleMs, locale });

  const updateClassifications = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const audiences = values.getAll("audiences") as ResourceAudience[];
    const topicIds = values.getAll("topicIds").map(String);
    const stageIds = values.getAll("stageIds").map(String);
    if (audiences.length === 0 || topicIds.length === 0) {
      return setNotice(t("resourceAdmin.detail.chooseAudienceAndTopic"));
    }
    if (audiences.includes("instructor") && stageIds.length === 0) {
      return setNotice(t("resourceAdmin.detail.instructorStageRequired"));
    }
    void mutations.replaceClassifications
      .mutateAsync({ audiences, resourceId, stageIds, topicIds })
      .then(() => setNotice(t("resourceAdmin.detail.classificationsUpdated")))
      .catch(() => setNotice(t("resourceAdmin.detail.classificationsUpdateFailed")));
  };

  const updateMetadata = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const estimated = String(values.get("estimatedMinutes")).trim();
    const contentLanguage = String(values.get("contentLanguage")) as ResourceLanguage;

    void mutations.updateMetadata
      .mutateAsync({
        contentLanguage,
        estimatedMinutes: estimated ? Number(estimated) : null,
        featured: values.get("featured") === "on",
        resourceId,
        slug: String(values.get("slug")),
        title: String(values.get("title")),
      })
      .then(() => setNotice(t("resourceAdmin.detail.metadataUpdated")))
      .catch(() => setNotice(t("resourceAdmin.detail.metadataUpdateFailed")));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link to="/app/admin/resources">
                <ArrowLeft aria-hidden="true" />
                {t("resourceAdmin.detail.backToAll")}
              </Link>
            </Button>
            {resource.status === "published" && resource.currentVersionId && (
              <Button asChild variant="outline">
                <Link to={`/app/admin/resources/${resource.id}/preview`}>
                  <Eye aria-hidden="true" />
                  {t("resourceAdmin.detail.previewCurrent")}
                </Link>
              </Button>
            )}
            {resource.status !== "retired" && resource.status !== "archived" && (
              <Button asChild>
                <Link to={`/app/admin/resources/${resource.id}/versions/new`}>
                  <FilePlus2 aria-hidden="true" />
                  {t("resourceAdmin.detail.newVersion")}
                </Link>
              </Button>
            )}
          </div>
        }
        description={`${t(resourceTypeKey(resource.type))} for ${courseTitle}. Manage immutable versions and controlled publication from this workspace.`}
        eyebrow="Resource record"
        title={resource.title}
      />
      <p aria-live="polite" className="text-sm font-medium text-info">{notice}</p>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resourceAdmin.detail.stableMetadata")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={updateMetadata}>
                <label className="text-sm font-semibold">
                  {t("resourceAdmin.new.resourceTitle")}
                  <Input className="mt-2" defaultValue={resource.title} maxLength={180} minLength={2} name="title" required />
                </label>
                <label className="text-sm font-semibold">
                  {t("resourceAdmin.new.urlSlug")}
                  <Input className="mt-2" defaultValue={resource.slug} maxLength={80} minLength={2} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                </label>
                <label className="text-sm font-semibold">
                  {t("resourceAdmin.new.contentLanguage")}
                  <select className={selectClassName} defaultValue={resource.contentLanguage} name="contentLanguage">
                    {contentLanguageOptions.map((lang) => (
                      <option key={lang} value={lang}>
                        {t(resourceLanguageKey(lang))}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  {t("resourceAdmin.new.estimatedMinutes")}
                  <Input className="mt-2" defaultValue={resource.estimatedMinutes ?? ""} max={600} min={1} name="estimatedMinutes" type="number" />
                </label>
                <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-3 text-sm font-semibold sm:col-span-2">
                  <input className="size-5" defaultChecked={resource.featured} name="featured" type="checkbox" />
                  {t("resourceAdmin.new.featureLibrary")}
                </label>
                <div className="border-t pt-4 sm:col-span-2">
                  <Button disabled={mutations.updateMetadata.isPending} type="submit">
                    <Save aria-hidden="true" />
                    {mutations.updateMetadata.isPending ? t("resourceAdmin.version.saving") : t("resourceAdmin.detail.saveMetadata")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{t("resourceAdmin.detail.versionHistory")}</CardTitle>
                <ResourceStatusBadge status={resource.status} />
              </div>
            </CardHeader>
            <CardContent>
              {resource.versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("resourceAdmin.detail.noVersions")}</p>
              ) : (
                <ol className="space-y-3">
                  {resource.versions.map((version) => (
                    <li className="rounded-xl border p-4" key={version.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{t("resourceAdmin.version.versionTitle")} {version.versionNumber}</h3>
                            <ResourceStatusBadge status={version.status} />
                            {resource.currentVersionId === version.id && (
                              <Badge variant="primary">{t("resourceAdmin.detail.currentLearnerVersion")}</Badge>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {version.title} · created {formatDateTime(version.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <Button asChild variant="outline">
                          <Link to={`/app/admin/resources/${resource.id}/versions/${version.id}`}>
                            {t("resourceAdmin.detail.openVersion")}
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("resourceAdmin.new.audienceAndDiscovery")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 lg:grid-cols-3" onSubmit={updateClassifications}>
                <fieldset>
                  <legend className="text-sm font-semibold">{t("resourceAdmin.resources.audiences")}</legend>
                  <div className="mt-2 space-y-2">
                    {(["learner", "instructor"] as const).map((audience) => (
                      <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={audience}>
                        <input className="size-5" defaultChecked={resource.audiences.includes(audience)} name="audiences" type="checkbox" value={audience} />
                        {t(resourceAudienceKey(audience))}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold">{t("resourceAdmin.taxonomy.topics")}</legend>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                    {catalog.data?.topics
                      .filter((topic) => topic.active || resource.topics.some((item) => item.id === topic.id))
                      .map((topic) => (
                        <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={topic.id}>
                          <input className="size-5" defaultChecked={resource.topics.some((item) => item.id === topic.id)} name="topicIds" type="checkbox" value={topic.id} />
                          {topic.name}
                          {!topic.active && <Badge variant="neutral">{t("resourceAdmin.resources.inactive")}</Badge>}
                        </label>
                      ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold">{t("resourceAdmin.taxonomy.stages")}</legend>
                  <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                    {catalog.data?.stages
                      .filter((stage) => stage.active || resource.stages.some((item) => item.id === stage.id))
                      .map((stage) => (
                        <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={stage.id}>
                          <input className="size-5" defaultChecked={resource.stages.some((item) => item.id === stage.id)} name="stageIds" type="checkbox" value={stage.id} />
                          {stage.name}
                          {!stage.active && <Badge variant="neutral">{t("resourceAdmin.resources.inactive")}</Badge>}
                        </label>
                      ))}
                  </div>
                </fieldset>
                <div className="border-t pt-4 lg:col-span-3">
                  <Button disabled={mutations.replaceClassifications.isPending} type="submit">
                    {mutations.replaceClassifications.isPending ? t("resourceAdmin.version.saving") : t("resourceAdmin.detail.saveDiscovery")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resourceAdmin.detail.resourceDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold">Slug</dt>
                  <dd className="break-all text-muted-foreground">{resource.slug}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resourceAdmin.new.course")}</dt>
                  <dd className="text-muted-foreground">{courseTitle}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resourceAdmin.new.contentLanguage")}</dt>
                  <dd className="text-muted-foreground">{t(resourceLanguageKey(resource.contentLanguage))}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resourceAdmin.detail.estimatedTime")}</dt>
                  <dd className="text-muted-foreground">{resource.estimatedMinutes ? `${resource.estimatedMinutes} ${t("resource.minutes")}` : t("resourceAdmin.detail.notSet")}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resourceAdmin.detail.lastUpdated")}</dt>
                  <dd className="text-muted-foreground">{formatDateTime(resource.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {resource.status === "published" && (
            <Card className="border-warning/30">
              <CardHeader>
                <CardTitle>{t("resourceAdmin.detail.retireTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("resourceAdmin.detail.retireDesc")}
                </p>
                <Button
                  className="mt-4"
                  disabled={mutations.retire.isPending}
                  onClick={() => {
                    if (!window.confirm(t("resourceAdmin.detail.retireConfirm"))) return;
                    void mutations.retire
                      .mutateAsync(resource.id)
                      .then(() => setNotice(t("resourceAdmin.detail.retiredNotice")))
                      .catch(() => setNotice(t("resourceAdmin.detail.retireFailed")));
                  }}
                  variant="danger"
                >
                  <RotateCcw aria-hidden="true" />
                  {mutations.retire.isPending ? t("resourceAdmin.version.saving") : t("resourceAdmin.detail.retireButton")}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                <Activity aria-hidden="true" className="mr-2 inline size-5" />
                {t("resourceAdmin.detail.recentAudit")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resource.auditEvents.length ? (
                <ol className="space-y-3">
                  {resource.auditEvents.map((event) => (
                    <li className="border-l-2 border-primary/25 pl-3 text-sm" key={event.id}>
                      <p className="font-semibold">{event.action.replaceAll(".", " · ").replaceAll("_", " ")}</p>
                      <p className="mt-1 text-muted-foreground">
                        {event.actorName} · {formatDateTime(event.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">{t("resourceAdmin.detail.noRecentAudit")}</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
