import { ArrowLeft, Check, Maximize2, Minimize2, PlayCircle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ProtectedPdfViewer } from "../components/protected-pdf-viewer";
import { LiveResourceRow } from "../components/live-resource-row";
import { useCourseResource } from "../hooks/use-resources";
import type { ResourceScope } from "../model/resource-types";
import { resourceTypeLabels } from "../model/resource-types";

const validYouTubeId = /^[A-Za-z0-9_-]{11}$/;

export function LiveResourceViewerPage({ adminPreview = false, scope }: { adminPreview?: boolean; scope: ResourceScope }) {
  const { resourceId = "" } = useParams();
  const catalog = useCourseResource(scope, resourceId);
  const [presentationMode, setPresentationMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const instructor = scope === "instructor";
  const libraryPath = adminPreview ? `/app/admin/resources/${resourceId}` : instructor ? "/app/instructor/teaching-kit" : "/app/learner/guides";
  const backLabel = adminPreview ? "resource workspace" : instructor ? "Teaching Kit" : "Guides";

  useEffect(() => {
    if (!presentationMode) return undefined;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPresentationMode(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [presentationMode]);

  if (catalog.isPending) return <StatePanel kind="loading" title="Loading resource" description="Checking your permitted course materials." />;
  if (catalog.isError) return <StatePanel actionLabel="Try again" description="Check your connection and try again. Protected content was not retained." kind={navigator.onLine ? "error" : "offline"} onAction={() => void catalog.refetch()} title="Resource is unavailable" />;
  if (!catalog.resource) return <StatePanel as="h1" description="This resource is not published for your role or current course access." kind="denied" title="Resource not found" />;

  const resource = catalog.resource;
  const related = (catalog.data ?? []).filter(({ id }) => resource.relatedResourceIds.includes(id));
  const sourceLabel = resource.guidelineSource ?? "Course resource";

  return (
    <div className={presentationMode ? "fixed inset-0 z-[200] overflow-y-auto bg-background p-4 sm:p-8" : "space-y-7"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link to={libraryPath}><ArrowLeft aria-hidden="true" />Back to {backLabel}</Link></Button>
        {instructor && !adminPreview && <Button aria-pressed={presentationMode} onClick={() => setPresentationMode((value) => !value)} variant="outline">{presentationMode ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}{presentationMode ? "Exit presentation view" : "Presentation view"}</Button>}
      </div>

      <PageHeader description={resource.summary} eyebrow={`${resource.topics.map(({ name }) => name).join(", ") || "General BLS"} · ${resourceTypeLabels[resource.type]}`} title={resource.title} />
      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{resourceTypeLabels[resource.type]}</Badge>
        <Badge>Version {resource.versionNumber}</Badge>
        {resource.estimatedMinutes && <Badge>{resource.estimatedMinutes} min</Badge>}
        {(instructor || adminPreview) && resource.teachingStages.map((stage) => <Badge key={stage.id} variant="info">{stage.name}</Badge>)}
      </div>

      {resource.type === "guide" && resource.content?.kind === "guide" && <Card className="shadow-none"><CardHeader><CardTitle>At-a-glance guide</CardTitle></CardHeader><CardContent><ol className="divide-y">{resource.content.sections.map((section, index) => <li className="flex gap-4 py-4 first:pt-0 last:pb-0" key={`${section.heading}-${index}`}><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><div><h2 className="font-semibold">{section.heading}</h2><p className="mt-1 text-muted-foreground">{section.body}</p></div></li>)}</ol></CardContent></Card>}

      {resource.type === "checklist" && resource.content?.kind === "checklist" && <Card className="shadow-none"><CardHeader><CardTitle>Viewing checklist</CardTitle></CardHeader><CardContent><fieldset><legend className="sr-only">Temporary checklist items</legend><div className="divide-y">{resource.content.items.map((item) => { const checked = checkedItems.includes(item); return <label className="flex min-h-14 cursor-pointer items-start gap-3 py-3" key={item}><input checked={checked} className="mt-1 size-5 accent-primary" onChange={() => setCheckedItems((current) => checked ? current.filter((value) => value !== item) : [...current, item])} type="checkbox" /><span className="font-medium">{item}</span></label>; })}</div></fieldset><p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Check aria-hidden="true" className="size-4" />Selections are temporary viewing aids and are not saved.</p></CardContent></Card>}

      {resource.type === "pdf" && <ProtectedPdfViewer resource={resource} />}

      {resource.type === "youtube_video" && <section aria-labelledby="video-heading"><h2 className="sr-only" id="video-heading">Training video</h2>{resource.youtubeVideoId && validYouTubeId.test(resource.youtubeVideoId) ? <div className="aspect-video overflow-hidden rounded-xl border bg-black"><iframe allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="size-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={`https://www.youtube-nocookie.com/embed/${resource.youtubeVideoId}`} title={resource.title} /></div> : <StatePanel description="This development record deliberately uses a non-playable video identifier. No external media was loaded." kind="empty" title="Video fixture is not playable"><PlayCircle aria-hidden="true" className="mt-4 size-5 text-muted-foreground" /></StatePanel>}</section>}

      <Card className="shadow-none"><CardContent className="pt-5 sm:pt-6"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Content source</dt><dd className="font-semibold">{sourceLabel}</dd></div><div><dt className="text-muted-foreground">Guideline year</dt><dd className="font-semibold">{resource.guidelineYear ?? "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Reviewed</dt><dd className="font-semibold">{resource.reviewedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(resource.reviewedAt)) : "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Next review</dt><dd className="font-semibold">{resource.nextReviewAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(resource.nextReviewAt)) : "Not scheduled"}</dd></div></dl></CardContent></Card>

      {related.length > 0 && <section aria-labelledby="related-heading"><h2 className="mb-3 text-xl font-bold" id="related-heading">Related resources</h2><div className="overflow-hidden rounded-xl border bg-card">{related.map((item) => <LiveResourceRow key={item.id} resource={item} to={`${libraryPath}/${item.id}`} />)}</div></section>}

      <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning"><ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p className="text-sm">{adminPreview ? "Administrator preview of the current published version. " : ""}Development data only. These fictional materials are not clinical guidance and must not be used for patient care.</p></div>
    </div>
  );
}
