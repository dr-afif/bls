import { StatePanel } from "../../../components/common/state-panel";

export function OperationState({ query, emptyTitle }: { query: { isPending: boolean; isError: boolean; refetch: () => unknown }; emptyTitle?: string }) {
  if (query.isPending) return <StatePanel kind="loading" title="Loading live operations data" description="Checking your permitted People and Cohorts records." />;
  if (query.isError) return <StatePanel actionLabel="Try again" kind="error" onAction={() => void query.refetch()} title="Operations data is unavailable" description="Check your connection and try again. No records were changed." />;
  if (emptyTitle) return <StatePanel kind="empty" title={emptyTitle} description="No permitted records are available for this account." />;
  return null;
}
