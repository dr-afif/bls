import { StatePanel } from "../../../components/common/state-panel";
import { useTranslation } from "../../../lib/i18n";

export function OperationState({ query, emptyTitle }: { query: { isPending: boolean; isError: boolean; refetch: () => unknown }; emptyTitle?: string }) {
  const { t } = useTranslation();
  if (query.isPending) return <StatePanel kind="loading" title={t("operations.state.loadingTitle")} description={t("operations.state.loadingDesc")} />;
  if (query.isError) return <StatePanel actionLabel={t("common.tryAgain")} kind="error" onAction={() => void query.refetch()} title={t("operations.state.errorTitle")} description={t("operations.state.errorDesc")} />;
  if (emptyTitle) return <StatePanel kind="empty" title={emptyTitle} description={t("operations.state.emptyDesc")} />;
  return null;
}
