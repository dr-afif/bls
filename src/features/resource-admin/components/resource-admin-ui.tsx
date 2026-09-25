import { AlertCircle, CheckCircle2, Clock3, FileClock, PackageCheck, PackageX } from "lucide-react";
import type { ReactNode } from "react";

import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { useTranslation } from "../../../lib/i18n";
import { resourceStatusKey } from "../../../lib/i18n/enum-labels";
import type { ResourceStatus } from "../model/resource-admin-types";

const statusIcon: Record<ResourceStatus, typeof Clock3> = {
  approved: PackageCheck,
  archived: PackageX,
  draft: FileClock,
  published: CheckCircle2,
  retired: PackageX,
  under_review: Clock3,
};

export function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  const { t } = useTranslation();
  const Icon = statusIcon[status];
  const variant = status === "published" || status === "approved"
    ? "success"
    : status === "under_review"
      ? "info"
      : status === "retired" || status === "archived"
        ? "neutral"
        : "warning";
  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" className="mr-1 size-3.5" />
      {t(resourceStatusKey(status))}
    </Badge>
  );
}

export function ResourceAdminState({ query, empty }: {
  empty?: boolean;
  query: { isError: boolean; isPending: boolean; refetch: () => unknown };
}) {
  const { t } = useTranslation();
  if (query.isPending) {
    return (
      <StatePanel
        kind="loading"
        title={t("resourceAdmin.state.loadingTitle")}
        description={t("resourceAdmin.state.loadingDesc")}
      />
    );
  }
  if (query.isError) {
    return (
      <StatePanel
        actionLabel={t("common.tryAgain")}
        kind="error"
        onAction={() => void query.refetch()}
        title={t("resourceAdmin.state.errorTitle")}
        description={t("resourceAdmin.state.errorDesc")}
      />
    );
  }
  if (empty) {
    return (
      <StatePanel
        kind="empty"
        title={t("resourceAdmin.state.emptyTitle")}
        description={t("resourceAdmin.state.emptyDesc")}
      />
    );
  }
  return null;
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return <p className="mt-1 flex items-center gap-1 text-sm font-medium text-destructive" id={id}><AlertCircle aria-hidden="true" className="size-4" />{children}</p>;
}
