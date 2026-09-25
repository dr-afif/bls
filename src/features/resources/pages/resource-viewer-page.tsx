import { ArrowLeft, Check, Maximize2, Minimize2, PlayCircle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useTranslation } from "../../../lib/i18n";
import { resourceLanguageKey, resourceTypeKey } from "../../../lib/i18n/enum-labels";
import { ProtectedPdfViewer } from "../components/protected-pdf-viewer";
import { LiveResourceRow } from "../components/live-resource-row";
import { useCourseResource } from "../hooks/use-resources";
import type { ResourceScope } from "../model/resource-types";

const validYouTubeId = /^[A-Za-z0-9_-]{11}$/;

export function LiveResourceViewerPage({ adminPreview = false, scope }: { adminPreview?: boolean; scope: ResourceScope }) {
  const { t, formatDate } = useTranslation();
  const { resourceId = "" } = useParams();
  const catalog = useCourseResource(scope, resourceId);
  const [presentationMode, setPresentationMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const instructor = scope === "instructor";
  const libraryPath = adminPreview ? `/app/admin/resources/${resourceId}` : instructor ? "/app/instructor/teaching-kit" : "/app/learner/guides";
  const backLabel = adminPreview ? t("resource.viewer.backToResourceWorkspace") : instructor ? t("resource.viewer.backToTeachingKit") : t("resource.viewer.backToGuides");

  useEffect(() => {
    if (!presentationMode) return undefined;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPresentationMode(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [presentationMode]);

  if (catalog.isPending) {
    return (
      <StatePanel
        kind="loading"
        title={t("resource.viewer.loadingTitle")}
        description={t("resource.viewer.loadingDesc")}
      />
    );
  }
  if (catalog.isError) {
    return (
      <StatePanel
        actionLabel={t("common.tryAgain")}
        description={t("resource.viewer.unavailableDesc")}
        kind={navigator.onLine ? "error" : "offline"}
        onAction={() => void catalog.refetch()}
        title={t("resource.viewer.unavailableTitle")}
      />
    );
  }
  if (!catalog.resource) {
    return (
      <StatePanel
        as="h1"
        description={t("resource.viewer.notFoundDesc")}
        kind="denied"
        title={t("resource.viewer.notFoundTitle")}
      />
    );
  }

  const resource = catalog.resource;
  const related = (catalog.data ?? []).filter(({ id }) => resource.relatedResourceIds.includes(id));
  const sourceLabel = resource.guidelineSource ?? "Course resource";

  return (
    <div className={presentationMode ? "fixed inset-0 z-[200] overflow-y-auto bg-background p-4 sm:p-8" : "space-y-7"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to={libraryPath}>
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
        {instructor && !adminPreview && (
          <Button aria-pressed={presentationMode} onClick={() => setPresentationMode((value) => !value)} variant="outline">
            {presentationMode ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            {presentationMode ? t("resource.viewer.exitPresentationView") : t("resource.viewer.presentationView")}
          </Button>
        )}
      </div>

      <PageHeader
        description={resource.summary}
        eyebrow={`${resource.topics.map(({ name }) => name).join(", ") || t("resource.generalBls")} · ${t(resourceTypeKey(resource.type))}`}
        title={resource.title}
      />
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{t(resourceTypeKey(resource.type))}</Badge>
        <Badge variant="neutral">{t(resourceLanguageKey(resource.contentLanguage))}</Badge>
        <Badge>{t("resource.viewer.version")} {resource.versionNumber}</Badge>
        {resource.estimatedMinutes && <Badge>{resource.estimatedMinutes} {t("resource.minutes")}</Badge>}
        {(instructor || adminPreview) && resource.teachingStages.map((stage) => <Badge key={stage.id} variant="info">{stage.name}</Badge>)}
      </div>

      {resource.type === "guide" && resource.content?.kind === "guide" && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t("resource.viewer.atAGlance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {resource.content.sections.map((section, index) => (
                <li className="flex gap-4 py-4 first:pt-0 last:pb-0" key={`${section.heading}-${index}`}>
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="font-semibold">{section.heading}</h2>
                    <p className="mt-1 text-muted-foreground">{section.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {resource.type === "checklist" && resource.content?.kind === "checklist" && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>{t("resource.viewer.checklistTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset>
              <legend className="sr-only">Temporary checklist items</legend>
              <div className="divide-y">
                {resource.content.items.map((item) => {
                  const checked = checkedItems.includes(item);
                  return (
                    <label className="flex min-h-14 cursor-pointer items-start gap-3 py-3" key={item}>
                      <input
                        checked={checked}
                        className="mt-1 size-5 accent-primary"
                        onChange={() => setCheckedItems((current) => checked ? current.filter((value) => value !== item) : [...current, item])}
                        type="checkbox"
                      />
                      <span className="font-medium">{item}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Check aria-hidden="true" className="size-4" />
              {t("resource.viewer.checklistNotice")}
            </p>
          </CardContent>
        </Card>
      )}

      {resource.type === "pdf" && <ProtectedPdfViewer resource={resource} />}

      {resource.type === "youtube_video" && (
        <section aria-labelledby="video-heading">
          <h2 className="sr-only" id="video-heading">{t("resource.viewer.trainingVideo")}</h2>
          {resource.youtubeVideoId && validYouTubeId.test(resource.youtubeVideoId) ? (
            <div className="aspect-video overflow-hidden rounded-xl border bg-black">
              <iframe
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
                className="size-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                src={`https://www.youtube-nocookie.com/embed/${resource.youtubeVideoId}`}
                title={resource.title}
              />
            </div>
          ) : (
            <StatePanel
              description={t("resource.viewer.videoFixtureDesc")}
              kind="empty"
              title={t("resource.viewer.videoFixtureNotPlayable")}
            >
              <PlayCircle aria-hidden="true" className="mt-4 size-5 text-muted-foreground" />
            </StatePanel>
          )}
        </section>
      )}

      <Card className="shadow-none">
        <CardContent className="pt-5 sm:pt-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">{t("resource.viewer.contentSource")}</dt>
              <dd className="font-semibold">{sourceLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("resource.viewer.guidelineYear")}</dt>
              <dd className="font-semibold">{resource.guidelineYear ?? t("resource.viewer.notRecorded")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("resource.viewer.reviewed")}</dt>
              <dd className="font-semibold">{resource.reviewedAt ? formatDate(resource.reviewedAt, { dateStyle: "medium" }) : t("resource.viewer.notRecorded")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("resource.viewer.nextReview")}</dt>
              <dd className="font-semibold">{resource.nextReviewAt ? formatDate(resource.nextReviewAt, { dateStyle: "medium" }) : t("resource.viewer.notScheduled")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 className="mb-3 text-xl font-bold" id="related-heading">{t("resource.viewer.relatedResources")}</h2>
          <div className="overflow-hidden rounded-xl border bg-card">
            {related.map((item) => <LiveResourceRow key={item.id} resource={item} to={`${libraryPath}/${item.id}`} />)}
          </div>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          {adminPreview ? `${t("resource.viewer.adminPreviewNotice")} ` : ""}
          {t("resource.viewer.clinicalNotice")}
        </p>
      </div>
    </div>
  );
}
