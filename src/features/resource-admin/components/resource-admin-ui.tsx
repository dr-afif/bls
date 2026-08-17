import { AlertCircle, CheckCircle2, Clock3, FileClock, PackageCheck, PackageX } from "lucide-react";
import type { ReactNode } from "react";

import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import type { ResourceStatus } from "../model/resource-admin-types";
import { resourceStatusLabels } from "../model/resource-admin-types";

const statusIcon: Record<ResourceStatus, typeof Clock3> = {
  approved: PackageCheck,
  archived: PackageX,
  draft: FileClock,
  published: CheckCircle2,
  retired: PackageX,
  under_review: Clock3,
};

export function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  const Icon = statusIcon[status];
  const variant = status === "published" || status === "approved"
    ? "success"
    : status === "under_review"
      ? "info"
      : status === "retired" || status === "archived"
        ? "neutral"
        : "warning";
  return <Badge variant={variant}><Icon aria-hidden="true" className="mr-1 size-3.5" />{resourceStatusLabels[status]}</Badge>;
}

export function ResourceAdminState({ query, empty }: {
  empty?: boolean;
  query: { isError: boolean; isPending: boolean; refetch: () => unknown };
}) {
  if (query.isPending) return <StatePanel kind="loading" title="Loading resource workspace" description="Checking the resource records permitted for your administrator account." />;
  if (query.isError) return <StatePanel actionLabel="Try again" kind="error" onAction={() => void query.refetch()} title="Resources are unavailable" description="Check your connection and try again. No resource records were changed." />;
  if (empty) return <StatePanel kind="empty" title="No resources yet" description="Create the first controlled course resource and its initial draft version." />;
  return null;
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return <p className="mt-1 flex items-center gap-1 text-sm font-medium text-destructive" id={id}><AlertCircle aria-hidden="true" className="size-4" />{children}</p>;
}
