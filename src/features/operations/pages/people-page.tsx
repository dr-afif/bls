import { CheckCircle2, Search, ShieldAlert, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useTranslation } from "../../../lib/i18n";
import { accountStatusKey, appRoleKey, membershipStatusKey } from "../../../lib/i18n/enum-labels";
import { useAuth } from "../../auth/context/auth-context";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { InviteUserDialog } from "../components/invite-user-dialog";
import { OperationState } from "../components/operation-state";
import { useOperationsMutations, usePeople } from "../hooks/use-operations";

export function OperationsPeoplePage() {
  const { t } = useTranslation();
  const people = usePeople();
  const { state } = useAuth();
  const access = useAccountAccess();
  const { updateStatus } = useOperationsMutations();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const isAdmin = access.data?.roles.some((role) => role === "admin" || role === "super_admin") ?? false;
  const organizationId = access.data?.profile?.organizationId;

  const filtered = useMemo(() => (people.data ?? []).filter((person) => {
    const search = query.trim().toLowerCase();
    return !search || `${person.fullName} ${person.staffId ?? ""} ${person.profession ?? ""} ${person.department ?? ""}`.toLowerCase().includes(search);
  }), [people.data, query]);

  if (people.isPending || people.isError) return <OperationState query={people} />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          isAdmin ? (
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus aria-hidden="true" />
              {t("operations.people.inviteUser")}
            </Button>
          ) : undefined
        }
        description={t("operations.people.description")}
        eyebrow={t("shell.liveDevelopmentWorkspace")}
        title={t("operations.people.title")}
      />
      <InviteUserDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        onSuccess={(user) => setNotice(`${t("operations.invite.invitationSent")} (${user.email})`)}
        organizationId={organizationId}
      />

      <div className="rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info">
        {t("operations.people.emailNotice")}
      </div>
      <Card className="shadow-none">
        <CardContent className="pt-5 sm:pt-6">
          <label className="text-sm font-semibold" htmlFor="operations-people-search">
            {t("operations.people.searchLabel")}
          </label>
          <div className="relative mt-2 max-w-xl">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              id="operations-people-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("operations.people.searchPlaceholder")}
              type="search"
              value={query}
            />
          </div>
        </CardContent>
      </Card>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? t("operations.people.person") : t("operations.people.people")}. {notice}
      </p>
      {filtered.length === 0 ? (
        <OperationState emptyTitle={t("operations.people.emptyTitle")} query={{ isPending: false, isError: false, refetch: people.refetch }} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((person) => {
            const active = person.accountStatus === "active";
            const isCurrentAccount = state.status === "signed_in" && state.user.id === person.id;
            return (
              <article className="rounded-xl border bg-card p-4 sm:p-5" key={person.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{person.fullName}</h2>
                      <Badge variant={active ? "success" : "warning"}>
                        {active ? <CheckCircle2 aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
                        {t(accountStatusKey(person.accountStatus))}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {person.roles.map((role) => t(appRoleKey(role))).join(", ") || t("operations.people.noRole")}
                      {person.staffId ? ` · ${person.staffId}` : ""}
                    </p>
                    <p className="mt-2 text-sm">
                      {person.memberships.map((membership) => `${membership.cohortCode} (${t(membershipStatusKey(membership.status))})`).join(", ") || t("operations.people.noCohortAssignment")}
                    </p>
                  </div>
                  {isCurrentAccount ? (
                    <Badge variant="neutral">{t("operations.people.currentAccount")}</Badge>
                  ) : (
                    <Button
                      disabled={updateStatus.isPending}
                      variant={active ? "danger" : "outline"}
                      onClick={() =>
                        void updateStatus
                          .mutateAsync({ targetUserId: person.id, accountStatus: active ? "suspended" : "active" })
                          .then(() => setNotice(t("operations.people.statusUpdated")))
                          .catch(() => setNotice(t("operations.people.statusUpdateFailed")))
                      }
                    >
                      {active ? t("operations.people.suspendAccess") : t("operations.people.restoreAccess")}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
