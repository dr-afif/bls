import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

const statusVariant = {
  Active: "success",
  Invited: "info",
  "Needs assignment": "warning",
  Suspended: "destructive",
} as const;

export function AdminPeoplePage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState("All statuses");
  const [notice, setNotice] = useState("");

  const filteredPeople = useMemo(() => {
    if (adminState.status !== "ready") return [];
    const normalizedQuery = query.trim().toLowerCase();
    return adminState.data.people.filter((person) => {
      const matchesQuery =
        !normalizedQuery ||
        `${person.name} ${person.email} ${person.cohort}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesRole = role === "All roles" || person.role === role;
      const matchesStatus =
        status === "All statuses" || person.status === status;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [adminState, query, role, status]);

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            onClick={() =>
              setNotice("Prototype only: no person record was created.")
            }
          >
            <UserPlus aria-hidden="true" />
            Add person
          </Button>
        }
        description="Search fictional learner and instructor records, cohort assignments and access states."
        eyebrow="Administration"
        title="People"
      />

      <p aria-live="polite" className="text-sm text-info">
        {notice}
      </p>

      <Card className="shadow-none">
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 sm:pt-6 lg:grid-cols-[1fr_14rem_14rem]">
          <div>
            <label className="text-sm font-semibold" htmlFor="people-search">
              Search people
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                className="pl-10"
                id="people-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email or cohort"
                type="search"
                value={query}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="people-role">
              Role
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-sm"
              id="people-role"
              onChange={(event) => setRole(event.target.value)}
              value={role}
            >
              {["All roles", "Learner", "Instructor", "Administrator"].map(
                (option) => (
                  <option key={option}>{option}</option>
                ),
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="people-status">
              Status
            </label>
            <select
              className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-sm"
              id="people-status"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {[
                "All statuses",
                "Active",
                "Invited",
                "Needs assignment",
                "Suspended",
              ].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {filteredPeople.length}{" "}
        {filteredPeople.length === 1 ? "person" : "people"}
      </p>

      {filteredPeople.length ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Fictional people records filtered by the controls above
              </caption>
              <thead className="bg-muted/65">
                <tr>
                  {["Name", "Role", "Cohort", "Status"].map((heading) => (
                    <th className="px-4 py-3 font-semibold" key={heading} scope="col">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPeople.map((person) => (
                  <tr className="hover:bg-muted/40" key={person.id}>
                    <th className="px-4 py-3" scope="row">
                      <span className="font-semibold">{person.name}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {person.email}
                      </span>
                    </th>
                    <td className="px-4 py-3">{person.role}</td>
                    <td className="px-4 py-3">{person.cohort}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[person.status]}>
                        {person.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {filteredPeople.map((person) => (
              <div className="rounded-xl border bg-card p-4" key={person.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {person.email}
                    </p>
                  </div>
                  <Badge variant={statusVariant[person.status]}>
                    {person.status}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="font-semibold">{person.role}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cohort</dt>
                    <dd className="font-semibold">{person.cohort}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </>
      ) : (
        <StatePanel
          compact
          description="Change the search, role, or status filters."
          kind="empty"
          title="No people match"
        />
      )}
    </div>
  );
}

