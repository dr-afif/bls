import { ArrowLeft, CheckCheck, FileCheck2, Send, Trash2, Upload } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useTranslation } from "../../../lib/i18n";
import { ResourceAdminState, ResourceStatusBadge } from "../components/resource-admin-ui";
import { VersionDraftForm, type VersionDraftValues } from "../components/version-draft-form";
import { useAdminResourceCatalog, useAdminResourceMutations, useDraftPdfStatus } from "../hooks/use-admin-resources";
import { draftBodyFromContent } from "../model/resource-admin-form-utils";

export function ResourceVersionPage() {
  const { t, formatDateTime } = useTranslation();
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

  const displayDate = (value: string | null) =>
    value ? formatDateTime(value, { dateStyle: "medium", timeStyle: "short" }) : t("resource.viewer.notRecorded");

  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  if (!resource || !version) {
    return (
      <StatePanel
        as="h1"
        kind="error"
        title={t("resourceAdmin.version.notFoundTitle")}
        description={t("resourceAdmin.version.notFoundDesc")}
      />
    );
  }

  const update = async (values: VersionDraftValues) => {
    setNotice("");
    try {
      await mutations.updateDraft.mutateAsync({ values, versionId });
      setNotice(t("resourceAdmin.version.draftSavedNotice"));
    } catch {
      setNotice(t("resourceAdmin.version.draftSaveFailed"));
    }
  };

  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("pdf") as File | null;
    if (!file || file.size === 0 || !version.storagePath) return setNotice(t("resourceAdmin.version.choosePdfNotice"));
    try {
      await mutations.uploadPdf.mutateAsync({ file, path: version.storagePath });
      setNotice(t("resourceAdmin.version.pdfUploadedNotice"));
      void pdfStatus.refetch();
    } catch {
      try {
        await mutations.discard.mutateAsync({ storagePath: version.storagePath, versionId: version.id });
        navigate(`/app/admin/resources/${resource.id}`, { replace: true });
      } catch {
        setNotice(t("resourceAdmin.version.uploadFailedNotice"));
      }
    }
  };

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch {
      setNotice(failure);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button asChild variant="ghost">
            <Link to={`/app/admin/resources/${resource.id}`}>
              <ArrowLeft aria-hidden="true" />
              {t("resourceAdmin.version.backToResource")}
            </Link>
          </Button>
        }
        description={t("resourceAdmin.version.versionDesc")}
        eyebrow={resource.title}
        title={`${t("resourceAdmin.version.versionTitle")} ${version.versionNumber}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <ResourceStatusBadge status={version.status} />
        {resource.currentVersionId === version.id && (
          <Badge variant="primary">{t("resourceAdmin.version.currentCatalogueVersion")}</Badge>
        )}
        {resource.type === "pdf" && (
          <Badge variant={pdfStatus.data?.file_state === "ready" ? "success" : "warning"}>
            {pdfStatus.isPending
              ? t("resourceAdmin.version.checkingPdf")
              : pdfStatus.data?.file_state === "ready"
                ? t("resourceAdmin.version.pdfUploaded")
                : t("resourceAdmin.version.pdfMissing")}
          </Badge>
        )}
      </div>
      <p aria-live="polite" className="rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground">
        {notice || t("resourceAdmin.version.noUnsavedChanges")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {version.status === "draft"
                  ? t("resourceAdmin.version.editDraftContent")
                  : t("resourceAdmin.version.immutableContentSnapshot")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {version.status === "draft" ? (
                <VersionDraftForm
                  disabled={mutations.updateDraft.isPending}
                  initial={{
                    contentBody: draftBodyFromContent(resource.type, version.content),
                    guidelineSource: version.guidelineSource ?? "",
                    guidelineYear: version.guidelineYear ? String(version.guidelineYear) : "",
                    summary: version.summary,
                    title: version.title,
                    youtubeVideoId: version.youtubeVideoId ?? "",
                  }}
                  onSubmit={update}
                  submitLabel={t("resourceAdmin.version.saveDraft")}
                  type={resource.type}
                />
              ) : (
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="font-semibold">{t("resourceAdmin.new.resourceTitle")}</dt>
                    <dd className="mt-1 text-muted-foreground">{version.title}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-semibold">{t("resourceAdmin.new.summary")}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{version.summary}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("resourceAdmin.new.guidelineSource")}</dt>
                    <dd className="mt-1 text-muted-foreground">{version.guidelineSource} {version.guidelineYear}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("common.created")}</dt>
                    <dd className="mt-1 text-muted-foreground">{displayDate(version.createdAt)}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {resource.type === "pdf" && version.status === "draft" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("resourceAdmin.version.privatePdf")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("resourceAdmin.version.privatePdfDesc")}
                </p>
                <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(event) => void upload(event)}>
                  <label className="flex-1 text-sm font-semibold">
                    {t("resourceAdmin.version.pdfFile")}
                    <Input
                      accept="application/pdf,.pdf"
                      className="mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:font-semibold"
                      name="pdf"
                      required
                      type="file"
                    />
                  </label>
                  <Button
                    disabled={mutations.uploadPdf.isPending || mutations.discard.isPending || pdfStatus.data?.file_state === "ready"}
                    type="submit"
                  >
                    <Upload aria-hidden="true" />
                    {mutations.uploadPdf.isPending || mutations.discard.isPending
                      ? t("resourceAdmin.version.uploadingChecking")
                      : t("resourceAdmin.version.uploadPrivatePdf")}
                  </Button>
                </form>
                {pdfStatus.data?.file_state === "ready" && (
                  <p className="mt-3 text-sm font-medium text-success">
                    {t("resourceAdmin.version.fileReady")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("resourceAdmin.version.lifecycleControls")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {version.status === "draft" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("resourceAdmin.version.submitForReviewDesc")}
                  </p>
                  <Button
                    className="w-full"
                    disabled={mutations.submitForReview.isPending}
                    onClick={() =>
                      void run(
                        () => mutations.submitForReview.mutateAsync(version.id),
                        t("resourceAdmin.version.reviewSubmittedSuccess"),
                        t("resourceAdmin.version.reviewSubmittedFailure"),
                      )
                    }
                  >
                    <Send aria-hidden="true" />
                    {t("resourceAdmin.version.submitForReview")}
                  </Button>
                  <Button
                    className="w-full"
                    disabled={mutations.discard.isPending}
                    onClick={() => {
                      if (!window.confirm(t("resourceAdmin.version.discardConfirm"))) return;
                      void mutations.discard
                        .mutateAsync({ storagePath: version.storagePath, versionId: version.id })
                        .then(() => navigate(`/app/admin/resources/${resource.id}`, { replace: true }))
                        .catch(() => setNotice(t("resourceAdmin.version.discardCleanupFailed")));
                    }}
                    variant="danger"
                  >
                    <Trash2 aria-hidden="true" />
                    {t("resourceAdmin.version.discardDraft")}
                  </Button>
                </>
              )}
              {version.status === "under_review" && (
                <>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const value = String(new FormData(event.currentTarget).get("nextReviewAt"));
                      void run(
                        () =>
                          mutations.recordReview.mutateAsync({
                            nextReviewAt: new Date(`${value}T23:59:59`).toISOString(),
                            versionId: version.id,
                          }),
                        t("resourceAdmin.version.reviewRecordedSuccess"),
                        t("resourceAdmin.version.reviewRecordedFailure"),
                      );
                    }}
                  >
                    <label className="text-sm font-semibold">
                      {t("resourceAdmin.version.nextClinicalReview")}
                      <Input className="mt-2" defaultValue={reviewDates.suggested} min={reviewDates.minimum} name="nextReviewAt" required type="date" />
                    </label>
                    <Button className="mt-3 w-full" disabled={mutations.recordReview.isPending} type="submit">
                      <FileCheck2 aria-hidden="true" />
                      {t("resourceAdmin.version.recordReview")}
                    </Button>
                  </form>
                  <Button
                    className="w-full"
                    disabled={!version.reviewedAt || mutations.approve.isPending}
                    onClick={() =>
                      void run(
                        () => mutations.approve.mutateAsync(version.id),
                        t("resourceAdmin.version.approveSuccess"),
                        t("resourceAdmin.version.approveFailure"),
                      )
                    }
                  >
                    <CheckCheck aria-hidden="true" />
                    {t("resourceAdmin.version.approveVersion")}
                  </Button>
                </>
              )}
              {version.status === "approved" && resource.currentVersionId !== version.id && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("resourceAdmin.version.publishVersionDesc")}
                  </p>
                  <Button
                    className="w-full"
                    disabled={mutations.publish.isPending}
                    onClick={() => {
                      if (!window.confirm(t("resourceAdmin.version.publishConfirm"))) return;
                      void run(
                        () => mutations.publish.mutateAsync({ resourceId: resource.id, versionId: version.id }),
                        t("resourceAdmin.version.publishSuccess"),
                        t("resourceAdmin.version.publishFailure"),
                      );
                    }}
                  >
                    <CheckCheck aria-hidden="true" />
                    {t("resourceAdmin.version.publishVersion")}
                  </Button>
                </>
              )}
              {version.status === "approved" && resource.currentVersionId === version.id && (
                <p className="text-sm text-muted-foreground">
                  {t("resourceAdmin.version.currentCatalogueVersionNotice")}
                </p>
              )}
              {(version.status === "published" || version.status === "retired" || version.status === "archived") && (
                <p className="text-sm text-muted-foreground">
                  {t("resourceAdmin.version.historicalVersionNotice")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("resourceAdmin.version.reviewEvidence")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold">{t("resource.viewer.reviewed")}</dt>
                  <dd className="text-muted-foreground">{displayDate(version.reviewedAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resource.viewer.nextReview")}</dt>
                  <dd className="text-muted-foreground">{displayDate(version.nextReviewAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold">{t("resourceStatus.approved")}</dt>
                  <dd className="text-muted-foreground">{displayDate(version.approvedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
