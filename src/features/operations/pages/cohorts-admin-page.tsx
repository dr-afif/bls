import { CalendarPlus, MapPin, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { OperationState } from "../components/operation-state";
import { useCohorts, useOperationsMutations, usePeople } from "../hooks/use-operations";
import type { MemberRole } from "../model/operations-types";

function localDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function OperationsCohortsAdminPage() {
  const cohorts = useCohorts();
  const people = usePeople();
  const access = useAccountAccess();
  const { assignMember, createCohort, updateCohortStatus, updateMembershipStatus } = useOperationsMutations();
  const [showEditor, setShowEditor] = useState(false);
  const [notice, setNotice] = useState("");

  if (cohorts.isPending || cohorts.isError) return <OperationState query={cohorts} />;

  const submitCohort = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const organizationId = access.data?.profile?.organizationId;
    if (!organizationId) return setNotice("Your profile has no organization assignment.");
    const values = new FormData(event.currentTarget);
    const start = String(values.get("startAt"));
    const end = String(values.get("endAt"));
    if (new Date(end) <= new Date(start)) return setNotice("End date and time must be after the start.");
    void createCohort.mutateAsync({
      organizationId,
      code: String(values.get("code")),
      name: String(values.get("name")),
      venue: String(values.get("venue")),
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      contactName: String(values.get("contactName")),
      contactPhone: String(values.get("contactPhone")),
      preparationNotes: String(values.get("preparationNotes")),
    }).then(() => { setNotice("Cohort created and audit event recorded."); setShowEditor(false); }).catch(() => setNotice("The cohort could not be created. Check the code and schedule."));
  };

  const candidates = people.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader action={<Button onClick={() => setShowEditor(true)}><CalendarPlus aria-hidden="true" />Create cohort</Button>} description="Schedule physical courses and assign existing fictional learners and instructors. Every change is organization-scoped and audited." eyebrow="Live development workspace" title="Cohorts" />
      <p aria-live="polite" className="text-sm text-info">{notice}</p>
      {showEditor && (
        <Card className="border-primary/25 shadow-none">
          <CardHeader><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-primary">New physical course</p><CardTitle className="mt-1">Create cohort</CardTitle></div><Button aria-label="Close cohort editor" onClick={() => setShowEditor(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div></CardHeader>
          <CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCohort}>
            <label className="text-sm font-semibold">Cohort code<Input className="mt-2" name="code" pattern="[A-Za-z0-9][A-Za-z0-9_-]*" required /></label>
            <label className="text-sm font-semibold">Course name<Input className="mt-2" name="name" required /></label>
            <label className="text-sm font-semibold">Starts<Input className="mt-2" name="startAt" required type="datetime-local" /></label>
            <label className="text-sm font-semibold">Ends<Input className="mt-2" name="endAt" required type="datetime-local" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Venue<Input className="mt-2" name="venue" required /></label>
            <label className="text-sm font-semibold">Contact name<Input className="mt-2" name="contactName" /></label>
            <label className="text-sm font-semibold">Contact phone<Input className="mt-2" name="contactPhone" type="tel" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Preparation notes<Input className="mt-2" name="preparationNotes" /></label>
            <div className="flex flex-wrap gap-3 border-t pt-4 sm:col-span-2"><Button disabled={createCohort.isPending} type="submit">{createCohort.isPending ? "Creating…" : "Create cohort"}</Button><Button onClick={() => setShowEditor(false)} type="button" variant="ghost">Cancel</Button></div>
          </form></CardContent>
        </Card>
      )}
      {cohorts.data?.length === 0 ? <OperationState emptyTitle="No cohorts yet" query={{ isPending: false, isError: false, refetch: cohorts.refetch }} /> : (
        <div className="grid gap-4">
          {cohorts.data?.map((cohort) => (
            <article className="rounded-xl border bg-card p-4 sm:p-5" key={cohort.id}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{cohort.code}</h2><Badge variant={cohort.status === "scheduled" || cohort.status === "active" ? "info" : "neutral"}>{cohort.status}</Badge></div><p className="mt-1 font-medium">{cohort.name}</p></div><p className="text-sm text-muted-foreground">{localDateTime(cohort.startAt)}</p></div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p className="flex gap-2"><MapPin aria-hidden="true" className="size-5 text-muted-foreground" />{cohort.venue || "Venue not set"}</p><p className="flex gap-2"><Users aria-hidden="true" className="size-5 text-muted-foreground" />{cohort.members.length} assigned</p></div>
              <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); const status = String(new FormData(event.currentTarget).get("status")) as typeof cohort.status; void updateCohortStatus.mutateAsync({ cohortId: cohort.id, status }).then(() => setNotice("Cohort status updated and audit event recorded.")).catch(() => setNotice("The cohort status could not be updated.")); }}>
                <label className="text-sm font-semibold">Cohort status<select className="mt-2 min-h-11 rounded-xl border bg-card px-3" defaultValue={cohort.status} name="status">{["draft", "scheduled", "active", "completed", "cancelled", "archived"].map((status) => <option key={status}>{status}</option>)}</select></label><Button disabled={updateCohortStatus.isPending} type="submit" variant="outline">Update status</Button>
              </form>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{cohort.members.map((member) => <li className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2" key={member.userId}><span>{member.fullName} · {member.memberRole} · {member.status}</span><Button disabled={updateMembershipStatus.isPending} onClick={() => void updateMembershipStatus.mutateAsync({ cohortId: cohort.id, userId: member.userId, status: member.status === "active" ? "removed" : "active" }).then(() => setNotice("Membership status updated and audit event recorded.")).catch(() => setNotice("The membership status could not be updated."))} size="sm" type="button" variant="ghost">{member.status === "active" ? "Remove" : "Reactivate"}</Button></li>)}</ul>
              <form className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_12rem_auto]" onSubmit={(event) => {
                event.preventDefault(); const values = new FormData(event.currentTarget); const userId = String(values.get("userId")); const memberRole = String(values.get("memberRole")) as MemberRole;
                void assignMember.mutateAsync({ cohortId: cohort.id, userId, memberRole }).then(() => setNotice("Cohort member assigned and audit event recorded.")).catch(() => setNotice("Assignment failed. Check role, organization, and existing active memberships."));
              }}>
                <label className="text-sm font-semibold">Person<select className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3" name="userId" required defaultValue=""><option disabled value="">Select existing person</option>{candidates.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label>
                <label className="text-sm font-semibold">Assignment<select className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3" name="memberRole"><option value="learner">Learner</option><option value="instructor">Instructor</option></select></label>
                <Button className="self-end" disabled={assignMember.isPending} type="submit">Assign</Button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
