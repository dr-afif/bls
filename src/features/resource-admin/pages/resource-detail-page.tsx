import { Activity, ArrowLeft, Eye, FilePlus2, RotateCcw, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { StatePanel } from "../../../components/common/state-panel";
import { ResourceAdminState, ResourceStatusBadge } from "../components/resource-admin-ui";
import { useAdminResourceCatalog, useAdminResourceMutations } from "../hooks/use-admin-resources";
import { resourceTypeLabels } from "../model/resource-admin-types";

function date(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ResourceDetailPage() {
  const { resourceId = "" } = useParams();
  const catalog = useAdminResourceCatalog();
  const mutations = useAdminResourceMutations();
  const [notice, setNotice] = useState("");
  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  const resource = catalog.data?.resources.find((item) => item.id === resourceId);
  if (!resource) return <StatePanel as="h1" kind="error" title="Resource not found" description="This resource is unavailable to your administrator account or no longer exists." />;

  const updateClassifications = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const audiences = values.getAll("audiences") as Array<"learner" | "instructor">;
    const topicIds = values.getAll("topicIds").map(String);
    const stageIds = values.getAll("stageIds").map(String);
    if (audiences.length === 0 || topicIds.length === 0) return setNotice("Choose at least one audience and BLS topic.");
    if (audiences.includes("instructor") && stageIds.length === 0) return setNotice("Instructor resources require a teaching stage before publication.");
    void mutations.replaceClassifications.mutateAsync({ audiences, resourceId, stageIds, topicIds })
      .then(() => setNotice("Audience and discovery settings updated. The change was audit recorded."))
      .catch(() => setNotice("Discovery settings could not be updated. No partial selection was saved."));
  };

  const updateMetadata = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const estimated = String(values.get("estimatedMinutes")).trim();
    void mutations.updateMetadata.mutateAsync({
      estimatedMinutes: estimated ? Number(estimated) : null,
      featured: values.get("featured") === "on",
      resourceId,
      slug: String(values.get("slug")),
      title: String(values.get("title")),
    }).then(() => setNotice("Resource metadata updated and audit recorded.")).catch(() => setNotice("Metadata could not be updated. Check the title, unique slug, and estimated time."));
  };

  return <div className="space-y-6">
    <PageHeader action={<div className="flex flex-wrap gap-2"><Button asChild variant="ghost"><Link to="/app/admin/resources"><ArrowLeft aria-hidden="true" />All resources</Link></Button>{resource.status === "published" && resource.currentVersionId && <Button asChild variant="outline"><Link to={`/app/admin/resources/${resource.id}/preview`}><Eye aria-hidden="true" />Preview current</Link></Button>}{resource.status !== "retired" && resource.status !== "archived" && <Button asChild><Link to={`/app/admin/resources/${resource.id}/versions/new`}><FilePlus2 aria-hidden="true" />New version</Link></Button>}</div>} description={`${resourceTypeLabels[resource.type]} for ${resource.courseTitle}. Manage immutable versions and controlled publication from this workspace.`} eyebrow="Resource record" title={resource.title} />
    <p aria-live="polite" className="text-sm font-medium text-info">{notice}</p>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>Stable resource metadata</CardTitle></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={updateMetadata}>
          <label className="text-sm font-semibold">Resource title<Input className="mt-2" defaultValue={resource.title} maxLength={180} minLength={2} name="title" required /></label>
          <label className="text-sm font-semibold">URL slug<Input className="mt-2" defaultValue={resource.slug} maxLength={80} minLength={2} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <label className="text-sm font-semibold">Estimated minutes<Input className="mt-2" defaultValue={resource.estimatedMinutes ?? ""} max={600} min={1} name="estimatedMinutes" type="number" /></label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-3 text-sm font-semibold"><input className="size-5" defaultChecked={resource.featured} name="featured" type="checkbox" />Feature in permitted libraries</label>
          <div className="border-t pt-4 sm:col-span-2"><Button disabled={mutations.updateMetadata.isPending} type="submit"><Save aria-hidden="true" />{mutations.updateMetadata.isPending ? "Saving…" : "Save metadata"}</Button></div>
        </form></CardContent></Card>
        <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Version history</CardTitle><ResourceStatusBadge status={resource.status} /></div></CardHeader><CardContent>
          {resource.versions.length === 0 ? <p className="text-sm text-muted-foreground">No versions have been created.</p> : <ol className="space-y-3">{resource.versions.map((version) => <li className="rounded-xl border p-4" key={version.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">Version {version.versionNumber}</h3><ResourceStatusBadge status={version.status} />{resource.currentVersionId === version.id && <Badge variant="primary">Current learner version</Badge>}</div><p className="mt-2 text-sm text-muted-foreground">{version.title} · created {date(version.createdAt)}</p></div><Button asChild variant="outline"><Link to={`/app/admin/resources/${resource.id}/versions/${version.id}`}>Open version</Link></Button></div></li>)}</ol>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Audience and discovery</CardTitle></CardHeader><CardContent><form className="grid gap-5 lg:grid-cols-3" onSubmit={updateClassifications}>
          <fieldset><legend className="text-sm font-semibold">Audience</legend><div className="mt-2 space-y-2">{(["learner", "instructor"] as const).map((audience) => <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={audience}><input className="size-5" defaultChecked={resource.audiences.includes(audience)} name="audiences" type="checkbox" value={audience} />{audience === "learner" ? "Learners" : "Instructors"}</label>)}</div></fieldset>
          <fieldset><legend className="text-sm font-semibold">BLS topics</legend><div className="mt-2 max-h-56 space-y-2 overflow-y-auto">{catalog.data?.topics.filter((topic) => topic.active || resource.topics.some((item) => item.id === topic.id)).map((topic) => <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={topic.id}><input className="size-5" defaultChecked={resource.topics.some((item) => item.id === topic.id)} name="topicIds" type="checkbox" value={topic.id} />{topic.name}{!topic.active && <Badge variant="neutral">Inactive · remove only</Badge>}</label>)}</div></fieldset>
          <fieldset><legend className="text-sm font-semibold">Teaching stages</legend><div className="mt-2 max-h-56 space-y-2 overflow-y-auto">{catalog.data?.stages.filter((stage) => stage.active || resource.stages.some((item) => item.id === stage.id)).map((stage) => <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={stage.id}><input className="size-5" defaultChecked={resource.stages.some((item) => item.id === stage.id)} name="stageIds" type="checkbox" value={stage.id} />{stage.name}{!stage.active && <Badge variant="neutral">Inactive · remove only</Badge>}</label>)}</div></fieldset>
          <div className="border-t pt-4 lg:col-span-3"><Button disabled={mutations.replaceClassifications.isPending} type="submit">{mutations.replaceClassifications.isPending ? "Saving…" : "Save discovery settings"}</Button></div>
        </form></CardContent></Card>
      </div>

      <aside className="space-y-6">
        <Card><CardHeader><CardTitle>Resource details</CardTitle></CardHeader><CardContent><dl className="space-y-3 text-sm"><div><dt className="font-semibold">Slug</dt><dd className="break-all text-muted-foreground">{resource.slug}</dd></div><div><dt className="font-semibold">Course</dt><dd className="text-muted-foreground">{resource.courseTitle}</dd></div><div><dt className="font-semibold">Estimated time</dt><dd className="text-muted-foreground">{resource.estimatedMinutes ? `${resource.estimatedMinutes} minutes` : "Not set"}</dd></div><div><dt className="font-semibold">Last updated</dt><dd className="text-muted-foreground">{date(resource.updatedAt)}</dd></div></dl></CardContent></Card>
        {resource.status === "published" && <Card className="border-warning/30"><CardHeader><CardTitle>Retire this resource</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Retirement removes this resource from learner and instructor catalogues while preserving historical versions and audit records.</p><Button className="mt-4" disabled={mutations.retire.isPending} onClick={() => { if (!window.confirm("Retire this published resource? This preserves its history but removes it from active catalogues.")) return; void mutations.retire.mutateAsync(resource.id).then(() => setNotice("Resource retired and audit recorded.")).catch(() => setNotice("The resource could not be retired.")); }} variant="danger"><RotateCcw aria-hidden="true" />{mutations.retire.isPending ? "Retiring…" : "Retire resource"}</Button></CardContent></Card>}
        <Card><CardHeader><CardTitle><Activity aria-hidden="true" className="mr-2 inline size-5" />Recent audit activity</CardTitle></CardHeader><CardContent>{resource.auditEvents.length ? <ol className="space-y-3">{resource.auditEvents.map((event) => <li className="border-l-2 border-primary/25 pl-3 text-sm" key={event.id}><p className="font-semibold">{event.action.replaceAll(".", " · ").replaceAll("_", " ")}</p><p className="mt-1 text-muted-foreground">{event.actorName} · {date(event.createdAt)}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">No recent resource activity is available.</p>}</CardContent></Card>
      </aside>
    </div>
  </div>;
}
