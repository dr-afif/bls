import { CheckCircle2, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useAuth } from "../../auth/context/auth-context";
import { OperationState } from "../components/operation-state";
import { useOperationsMutations, usePeople } from "../hooks/use-operations";

const roleLabel = { admin: "Administrator", instructor: "Instructor", learner: "Learner", super_admin: "Super administrator" } as const;

export function OperationsPeoplePage() {
  const people = usePeople();
  const { state } = useAuth();
  const { updateStatus } = useOperationsMutations();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => (people.data ?? []).filter((person) => {
    const search = query.trim().toLowerCase();
    return !search || `${person.fullName} ${person.staffId ?? ""} ${person.profession ?? ""} ${person.department ?? ""}`.toLowerCase().includes(search);
  }), [people.data, query]);

  if (people.isPending || people.isError) return <OperationState query={people} />;

  return (
    <div className="space-y-6">
      <PageHeader description="Manage existing fictional profiles and account access. Creating or deleting Auth users remains a trusted-operation boundary." eyebrow="Live development workspace" title="People" />
      <div className="rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info">
        Email addresses are intentionally excluded: browser clients cannot list Supabase Auth users.
      </div>
      <Card className="shadow-none"><CardContent className="pt-5 sm:pt-6">
        <label className="text-sm font-semibold" htmlFor="operations-people-search">Search people</label>
        <div className="relative mt-2 max-w-xl"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" id="operations-people-search" onChange={(event) => setQuery(event.target.value)} placeholder="Name, staff ID, profession or department" type="search" value={query} /></div>
      </CardContent></Card>
      <p aria-live="polite" className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "person" : "people"}. {notice}</p>
      {filtered.length === 0 ? <OperationState emptyTitle="No people match these filters" query={{ isPending: false, isError: false, refetch: people.refetch }} /> : (
        <div className="grid gap-3">
          {filtered.map((person) => {
            const active = person.accountStatus === "active";
            const isCurrentAccount = state.status === "signed_in" && state.user.id === person.id;
            return (
              <article className="rounded-xl border bg-card p-4 sm:p-5" key={person.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{person.fullName}</h2><Badge variant={active ? "success" : "warning"}>{active ? <CheckCircle2 aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}{person.accountStatus.replaceAll("_", " ")}</Badge></div>
                    <p className="mt-1 text-sm text-muted-foreground">{person.roles.map((role) => roleLabel[role]).join(", ") || "No role"}{person.staffId ? ` · ${person.staffId}` : ""}</p>
                    <p className="mt-2 text-sm">{person.memberships.map((membership) => `${membership.cohortCode} (${membership.status})`).join(", ") || "No cohort assignment"}</p>
                  </div>
                  {isCurrentAccount ? <Badge variant="neutral">Current account</Badge> : <Button disabled={updateStatus.isPending} variant={active ? "danger" : "outline"} onClick={() => void updateStatus.mutateAsync({ targetUserId: person.id, accountStatus: active ? "suspended" : "active" }).then(() => setNotice(`${person.fullName} is now ${active ? "suspended" : "active"}.`)).catch(() => setNotice("The account status could not be changed."))}>
                    {active ? "Suspend access" : "Restore access"}
                  </Button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
