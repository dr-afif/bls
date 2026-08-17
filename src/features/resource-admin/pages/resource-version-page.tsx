import { ArrowLeft, CheckCheck, FileCheck2, Send, Trash2, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { ResourceAdminState, ResourceStatusBadge } from "../components/resource-admin-ui";
import { VersionDraftForm, type VersionDraftValues } from "../components/version-draft-form";
import { useAdminResourceCatalog, useAdminResourceMutations, useDraftPdfStatus } from "../hooks/use-admin-resources";
import { draftBodyFromContent } from "../model/resource-admin-form-utils";

function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";
}

export function ResourceVersionPage() {
  const { resourceId = "", versionId = "" } = useParams();
  const catalog = useAdminResourceCatalog();
  const mutations = useAdminResourceMutations();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [reviewDates] = useState(() => {
    const now = new Date();
    const future = new Date(now);
    future.setFullYear(future.getFullYear() + 1);
    return { minimum: now.toISOString().slice(0, 10), suggested: future.toISOString().slice(0, 10) };
  });
  const resource = catalog.data?.resources.find((item) => item.id === resourceId);
  const version = resource?.versions.find((item) => item.id === versionId);
  const pdfStatus = useDraftPdfStatus(versionId, Boolean(resource?.type === "pdf" && version));

  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  if (!resource || !version) return <StatePanel as="h1" kind="error" title="Version not found" description="This version is unavailable to your administrator account or no longer exists." />;

  const update = async (values: VersionDraftValues) => {
    setNotice("");
    try {
      await mutations.updateDraft.mutateAsync({ values, versionId });
      setNotice("Draft content saved and audit recorded.");
    } catch {
      setNotice("The draft could not be saved. Submitted and approved versions are immutable.");
    }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = (new FormData(event.currentTarget).get("pdf") as File | null);
    if (!file || file.size === 0 || !version.storagePath) return setNotice("Choose one PDF file to upload.");
    try {
      await mutations.uploadPdf.mutateAsync({ file, path: version.storagePath });
      setNotice("Private PDF uploaded to the server-issued path.");
      void pdfStatus.refetch();
    } catch {
      try {
        await mutations.discard.mutateAsync({ storagePath: version.storagePath, versionId: version.id });
        navigate(`/app/admin/resources/${resource.id}`, { replace: true });
      } catch {
        setNotice("Upload failed and automatic cleanup was interrupted. This draft remains visible; use Discard draft to retry exact-path cleanup.");
      }
    }
  };

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    setNotice("");
    try { await action(); setNotice(success); } catch { setNotice(failure); }
  };

  return <div className="space-y-6">
    <PageHeader action={<Button asChild variant="ghost"><Link to={`/app/admin/resources/${resource.id}`}><ArrowLeft aria-hidden="true" />Back to resource</Link></Button>} description="A controlled, immutable version record. Lifecycle actions are validated on the server and written to the organization audit trail." eyebrow={resource.title} title={`Version ${version.versionNumber}`} />
    <div className="flex flex-wrap items-center gap-2"><ResourceStatusBadge status={version.status} />{resource.currentVersionId === version.id && <Badge variant="primary">Current catalogue version</Badge>}{resource.type === "pdf" && <Badge variant={pdfStatus.data?.file_state === "ready" ? "success" : "warning"}>{pdfStatus.isPending ? "Checking PDF…" : pdfStatus.data?.file_state === "ready" ? "PDF uploaded" : "PDF missing"}</Badge>}</div>
    <p aria-live="polite" className="rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground">{notice || "No unsaved lifecycle changes."}</p>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
      <div className="space-y-6">
        <Card><CardHeader><CardTitle>{version.status === "draft" ? "Edit draft content" : "Immutable content snapshot"}</CardTitle></CardHeader><CardContent>
          {version.status === "draft" ? <VersionDraftForm disabled={mutations.updateDraft.isPending} initial={{ contentBody: draftBodyFromContent(resource.type, version.content), guidelineSource: version.guidelineSource ?? "", guidelineYear: version.guidelineYear ? String(version.guidelineYear) : "", summary: version.summary, title: version.title, youtubeVideoId: version.youtubeVideoId ?? "" }} onSubmit={update} submitLabel="Save draft" type={resource.type} /> : <dl className="grid gap-4 text-sm sm:grid-cols-2"><div className="sm:col-span-2"><dt className="font-semibold">Title</dt><dd className="mt-1 text-muted-foreground">{version.title}</dd></div><div className="sm:col-span-2"><dt className="font-semibold">Summary</dt><dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{version.summary}</dd></div><div><dt className="font-semibold">Guideline</dt><dd className="mt-1 text-muted-foreground">{version.guidelineSource} {version.guidelineYear}</dd></div><div><dt className="font-semibold">Created</dt><dd className="mt-1 text-muted-foreground">{displayDate(version.createdAt)}</dd></div></dl>}
        </CardContent></Card>

        {resource.type === "pdf" && version.status === "draft" && <Card><CardHeader><CardTitle>Private PDF</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Upload one PDF up to 20 MiB. The file remains private, cannot be listed by browser users, and cannot be overwritten. A failed upload triggers exact-path cleanup; an interrupted cleanup leaves this draft visible for retry.</p><form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void upload(event)}><label className="flex-1 text-sm font-semibold">PDF file<Input accept="application/pdf,.pdf" className="mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:font-semibold" name="pdf" required type="file" /></label><Button disabled={mutations.uploadPdf.isPending || mutations.discard.isPending || pdfStatus.data?.file_state === "ready"} type="submit"><Upload aria-hidden="true" />{mutations.uploadPdf.isPending || mutations.discard.isPending ? "Uploading and checking…" : "Upload private PDF"}</Button></form>{pdfStatus.data?.file_state === "ready" && <p className="mt-3 text-sm font-medium text-success">File ready. To use a different file, discard this draft and create a new version.</p>}</CardContent></Card>}
      </div>

      <aside className="space-y-6">
        <Card><CardHeader><CardTitle>Lifecycle controls</CardTitle></CardHeader><CardContent className="space-y-4">
          {version.status === "draft" && <><p className="text-sm text-muted-foreground">Submitting freezes the content. For PDFs, the private file must already be uploaded.</p><Button className="w-full" disabled={mutations.submitForReview.isPending} onClick={() => void run(() => mutations.submitForReview.mutateAsync(version.id), "Version submitted for review and audit recorded.", "Submission failed. Confirm required content and the private PDF are ready.")}><Send aria-hidden="true" />Submit for review</Button><Button className="w-full" disabled={mutations.discard.isPending} onClick={() => { if (!window.confirm("Discard this draft version and its private PDF, if present? This cannot be undone.")) return; void mutations.discard.mutateAsync({ storagePath: version.storagePath, versionId: version.id }).then(() => navigate(`/app/admin/resources/${resource.id}`, { replace: true })).catch(() => setNotice("Draft cleanup failed. No approved or current version can be discarded.")); }} variant="danger"><Trash2 aria-hidden="true" />Discard draft</Button></>}
          {version.status === "under_review" && <><form onSubmit={(event) => { event.preventDefault(); const value = String(new FormData(event.currentTarget).get("nextReviewAt")); void run(() => mutations.recordReview.mutateAsync({ nextReviewAt: new Date(`${value}T23:59:59`).toISOString(), versionId: version.id }), "Review evidence recorded and audit updated.", "Review could not be recorded. Choose a future review date."); }}><label className="text-sm font-semibold">Next clinical review<Input className="mt-2" defaultValue={reviewDates.suggested} min={reviewDates.minimum} name="nextReviewAt" required type="date" /></label><Button className="mt-3 w-full" disabled={mutations.recordReview.isPending} type="submit"><FileCheck2 aria-hidden="true" />Record review</Button></form><Button className="w-full" disabled={!version.reviewedAt || mutations.approve.isPending} onClick={() => void run(() => mutations.approve.mutateAsync(version.id), "Version approved and audit recorded.", "Approval failed. Complete review evidence and guideline metadata first.")}><CheckCheck aria-hidden="true" />Approve version</Button></>}
          {version.status === "approved" && resource.currentVersionId !== version.id && <><p className="text-sm text-muted-foreground">Publishing makes this the current version for entitled users. Audience, topic, and instructor-stage rules are enforced by the server.</p><Button className="w-full" disabled={mutations.publish.isPending} onClick={() => { if (!window.confirm("Publish this approved version as the current catalogue version?")) return; void run(() => mutations.publish.mutateAsync({ resourceId: resource.id, versionId: version.id }), "Version published as current and audit recorded.", "Publication failed. Check audience, topic, teaching-stage, and private PDF requirements."); }}><CheckCheck aria-hidden="true" />Publish version</Button></>}
          {version.status === "approved" && resource.currentVersionId === version.id && <p className="text-sm text-muted-foreground">This is the current catalogue version. It remains immutable; create a new version to make a controlled replacement.</p>}
          {(version.status === "published" || version.status === "retired" || version.status === "archived") && <p className="text-sm text-muted-foreground">This historical version is immutable. Create a new version from the resource page to make a controlled replacement.</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Review evidence</CardTitle></CardHeader><CardContent><dl className="space-y-3 text-sm"><div><dt className="font-semibold">Reviewed</dt><dd className="text-muted-foreground">{displayDate(version.reviewedAt)}</dd></div><div><dt className="font-semibold">Next review</dt><dd className="text-muted-foreground">{displayDate(version.nextReviewAt)}</dd></div><div><dt className="font-semibold">Approved</dt><dd className="text-muted-foreground">{displayDate(version.approvedAt)}</dd></div></dl></CardContent></Card>
      </aside>
    </div>
  </div>;
}
