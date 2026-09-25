import { CalendarPlus, MapPin, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { localizedText, useTranslation } from "../../../lib/i18n";
import { appRoleKey, cohortStatusKey, membershipStatusKey } from "../../../lib/i18n/enum-labels";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { OperationState } from "../components/operation-state";
import { useCohorts, useOperationsMutations, usePeople } from "../hooks/use-operations";
import type { MemberRole } from "../model/operations-types";

export function OperationsCohortsAdminPage() {
  const { t, locale, formatDateTime } = useTranslation();
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
    if (!organizationId) return setNotice(t("operations.cohorts.noOrg"));
    const values = new FormData(event.currentTarget);
    const start = String(values.get("startAt"));
    const end = String(values.get("endAt"));
    if (new Date(end) <= new Date(start)) return setNotice(t("operations.cohorts.endAfterStart"));

    const nameMs = String(values.get("nameMs") ?? "").trim() || null;
    const description = String(values.get("description") ?? "").trim() || null;
    const descriptionMs = String(values.get("descriptionMs") ?? "").trim() || null;

    void createCohort.mutateAsync({
      organizationId,
      code: String(values.get("code")).trim(),
      name: String(values.get("name")).trim(),
      nameMs,
      description,
      descriptionMs,
      venue: String(values.get("venue")).trim(),
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      contactName: String(values.get("contactName")).trim(),
      contactPhone: String(values.get("contactPhone")).trim(),
      preparationNotes: String(values.get("preparationNotes")).trim(),
    }).then(() => {
      setNotice(t("operations.cohorts.createdNotice"));
      setShowEditor(false);
    }).catch(() => setNotice(t("operations.cohorts.createFailed")));
  };

  const candidates = people.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button onClick={() => setShowEditor(true)}>
            <CalendarPlus aria-hidden="true" />
            {t("operations.cohorts.createCohort")}
          </Button>
        }
        description={t("operations.cohorts.description")}
        eyebrow={t("shell.liveDevelopmentWorkspace")}
        title={t("operations.cohorts.title")}
      />
      <p aria-live="polite" className="text-sm text-info">{notice}</p>
      {showEditor && (
        <Card className="border-primary/25 shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">{t("operations.cohorts.newPhysicalCourse")}</p>
                <CardTitle className="mt-1">{t("operations.cohorts.createCohort")}</CardTitle>
              </div>
              <Button aria-label={t("operations.cohorts.closeEditor")} onClick={() => setShowEditor(false)} size="icon" variant="ghost">
                <X aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCohort}>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.code")}
                <Input className="mt-2" name="code" pattern="[A-Za-z0-9][A-Za-z0-9_-]*" required />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.nameEn")}
                <Input className="mt-2" name="name" required />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.nameMs")}
                <Input className="mt-2" name="nameMs" />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.descriptionEn")}
                <Input className="mt-2" name="description" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                {t("operations.cohorts.descriptionMs")}
                <Input className="mt-2" name="descriptionMs" />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.starts")}
                <Input className="mt-2" name="startAt" required type="datetime-local" />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.ends")}
                <Input className="mt-2" name="endAt" required type="datetime-local" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                {t("operations.cohorts.venue")}
                <Input className="mt-2" name="venue" required />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.contactName")}
                <Input className="mt-2" name="contactName" />
              </label>
              <label className="text-sm font-semibold">
                {t("operations.cohorts.contactPhone")}
                <Input className="mt-2" name="contactPhone" type="tel" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                {t("operations.cohorts.preparationNotes")}
                <Input className="mt-2" name="preparationNotes" />
              </label>
              <div className="flex flex-wrap gap-3 border-t pt-4 sm:col-span-2">
                <Button disabled={createCohort.isPending} type="submit">
                  {createCohort.isPending ? t("common.saving") : t("operations.cohorts.createCohort")}
                </Button>
                <Button onClick={() => setShowEditor(false)} type="button" variant="ghost">
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {cohorts.data?.length === 0 ? (
        <OperationState emptyTitle={t("operations.cohorts.emptyTitle")} query={{ isPending: false, isError: false, refetch: cohorts.refetch }} />
      ) : (
        <div className="grid gap-4">
          {cohorts.data?.map((cohort) => {
            const localizedName = localizedText({ en: cohort.name, ms: cohort.nameMs, locale });
            return (
              <article className="rounded-xl border bg-card p-4 sm:p-5" key={cohort.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{cohort.code}</h2>
                      <Badge variant={cohort.status === "scheduled" || cohort.status === "active" ? "info" : "neutral"}>
                        {t(cohortStatusKey(cohort.status))}
                      </Badge>
                    </div>
                    <p className="mt-1 font-medium">{localizedName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(cohort.startAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <p className="flex gap-2">
                    <MapPin aria-hidden="true" className="size-5 text-muted-foreground" />
                    {cohort.venue || t("operations.cohorts.venueNotSet")}
                  </p>
                  <p className="flex gap-2">
                    <Users aria-hidden="true" className="size-5 text-muted-foreground" />
                    {cohort.members.length} {t("operations.cohorts.assignedCount")}
                  </p>
                </div>
                <form
                  className="mt-4 flex flex-wrap items-end gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const status = String(new FormData(event.currentTarget).get("status")) as typeof cohort.status;
                    void updateCohortStatus
                      .mutateAsync({ cohortId: cohort.id, status })
                      .then(() => setNotice(t("operations.cohorts.statusUpdatedNotice")))
                      .catch(() => setNotice(t("operations.cohorts.statusUpdateFailed")));
                  }}
                >
                  <label className="text-sm font-semibold">
                    {t("operations.cohorts.statusLabel")}
                    <select className="mt-2 min-h-11 rounded-xl border bg-card px-3" defaultValue={cohort.status} name="status">
                      {(["draft", "scheduled", "active", "completed", "cancelled", "archived"] as const).map((status) => (
                        <option key={status} value={status}>
                          {t(cohortStatusKey(status))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button disabled={updateCohortStatus.isPending} type="submit" variant="outline">
                    {t("operations.cohorts.updateStatus")}
                  </Button>
                </form>
                <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {cohort.members.map((member) => (
                    <li className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2" key={member.userId}>
                      <span>
                        {member.fullName} · {t(appRoleKey(member.memberRole))} · {t(membershipStatusKey(member.status))}
                      </span>
                      <Button
                        disabled={updateMembershipStatus.isPending}
                        onClick={() =>
                          void updateMembershipStatus
                            .mutateAsync({ cohortId: cohort.id, userId: member.userId, status: member.status === "active" ? "removed" : "active" })
                            .then(() => setNotice(t("operations.cohorts.membershipUpdated")))
                            .catch(() => setNotice(t("operations.cohorts.membershipUpdateFailed")))
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {member.status === "active" ? t("operations.cohorts.remove") : t("operations.cohorts.reactivate")}
                      </Button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-[1fr_12rem_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const values = new FormData(event.currentTarget);
                    const userId = String(values.get("userId"));
                    const memberRole = String(values.get("memberRole")) as MemberRole;
                    void assignMember
                      .mutateAsync({ cohortId: cohort.id, userId, memberRole })
                      .then(() => setNotice(t("operations.cohorts.memberAssigned")))
                      .catch(() => setNotice(t("operations.cohorts.assignmentFailed")));
                  }}
                >
                  <label className="text-sm font-semibold">
                    {t("operations.cohorts.person")}
                    <select className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3" defaultValue="" name="userId" required>
                      <option disabled value="">
                        {t("operations.cohorts.selectPerson")}
                      </option>
                      {candidates.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    {t("operations.cohorts.assignment")}
                    <select className="mt-2 min-h-11 w-full rounded-xl border bg-card px-3" name="memberRole">
                      <option value="learner">{t("role.learner")}</option>
                      <option value="instructor">{t("role.instructor")}</option>
                    </select>
                  </label>
                  <Button className="self-end" disabled={assignMember.isPending} type="submit">
                    {t("operations.cohorts.assign")}
                  </Button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
