import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useTranslation } from "../../../lib/i18n";
import { ResourceAdminState } from "../components/resource-admin-ui";
import { VersionDraftForm, type VersionDraftValues } from "../components/version-draft-form";
import { useAdminResourceCatalog, useAdminResourceMutations } from "../hooks/use-admin-resources";

export function ResourceVersionNewPage() {
  const { t } = useTranslation();
  const { resourceId = "" } = useParams();
  const catalog = useAdminResourceCatalog();
  const { createVersion } = useAdminResourceMutations();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  const resource = catalog.data?.resources.find((item) => item.id === resourceId);
  if (!resource) return <StatePanel as="h1" kind="error" title={t("resource.viewer.notFoundTitle")} description={t("resource.viewer.notFoundDesc")} />;

  const submit = async (values: VersionDraftValues) => {
    setNotice("");
    try {
      const created = await createVersion.mutateAsync({ resourceId, ...values });
      navigate(`/app/admin/resources/${resourceId}/versions/${created.version_id}`, { replace: true });
    } catch {
      setNotice("The new version could not be created. Retired resources cannot receive new versions.");
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
        description={t("resourceAdmin.version.newVersionDesc")}
        eyebrow={resource.title}
        title={t("resourceAdmin.version.newVersionTitle")}
      />
      <p aria-live="polite" className="text-sm font-medium text-destructive">{notice}</p>
      <Card>
        <CardHeader>
          <CardTitle>{t("resourceAdmin.version.draftVersion")} {resource.versions.length + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <VersionDraftForm
            disabled={createVersion.isPending}
            initial={{ title: resource.title }}
            onSubmit={submit}
            submitLabel={t("resourceAdmin.version.createVersionDraft")}
            type={resource.type}
          />
        </CardContent>
      </Card>
    </div>
  );
}
