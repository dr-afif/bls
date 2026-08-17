import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ResourceAdminState } from "../components/resource-admin-ui";
import { VersionDraftForm, type VersionDraftValues } from "../components/version-draft-form";
import { useAdminResourceCatalog, useAdminResourceMutations } from "../hooks/use-admin-resources";

export function ResourceVersionNewPage() {
  const { resourceId = "" } = useParams();
  const catalog = useAdminResourceCatalog();
  const { createVersion } = useAdminResourceMutations();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;
  const resource = catalog.data?.resources.find((item) => item.id === resourceId);
  if (!resource) return <StatePanel as="h1" kind="error" title="Resource not found" description="This resource is unavailable to your account." />;

  const submit = async (values: VersionDraftValues) => {
    setNotice("");
    try {
      const created = await createVersion.mutateAsync({ resourceId, ...values });
      navigate(`/app/admin/resources/${resourceId}/versions/${created.version_id}`, { replace: true });
    } catch {
      setNotice("The new version could not be created. Retired resources cannot receive new versions.");
    }
  };

  return <div className="space-y-6"><PageHeader action={<Button asChild variant="ghost"><Link to={`/app/admin/resources/${resource.id}`}><ArrowLeft aria-hidden="true" />Back to resource</Link></Button>} description="Create a new immutable draft while keeping the currently published version available to entitled users." eyebrow={resource.title} title="New resource version" /><p aria-live="polite" className="text-sm font-medium text-destructive">{notice}</p><Card><CardHeader><CardTitle>Draft version {resource.versions.length + 1}</CardTitle></CardHeader><CardContent><VersionDraftForm disabled={createVersion.isPending} initial={{ title: resource.title }} onSubmit={submit} submitLabel="Create version draft" type={resource.type} /></CardContent></Card></div>;
}
