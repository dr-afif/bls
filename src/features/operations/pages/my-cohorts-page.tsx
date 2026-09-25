import { CalendarClock, MapPin, Phone, Users } from "lucide-react";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { localizedText, useTranslation } from "../../../lib/i18n";
import { cohortStatusKey } from "../../../lib/i18n/enum-labels";
import { InstructorCohortReadiness } from "../components/instructor-cohort-readiness";
import { OperationState } from "../components/operation-state";
import { useCohorts } from "../hooks/use-operations";

export function MyCohortsPage({ instructor = false }: { instructor?: boolean }) {
  const { t, locale, formatDateTime } = useTranslation();
  const cohorts = useCohorts();
  if (cohorts.isPending || cohorts.isError) return <OperationState query={cohorts} />;
  if (!cohorts.data?.length) {
    return (
      <OperationState
        emptyTitle={instructor ? t("operations.myCohorts.emptyInstructor") : t("operations.myCohorts.emptyLearner")}
        query={{ isPending: false, isError: false, refetch: cohorts.refetch }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={instructor ? t("operations.myCohorts.instructorDesc") : t("operations.myCohorts.learnerDesc")}
        eyebrow="Live development workspace"
        title={instructor ? t("operations.myCohorts.instructorTitle") : t("operations.myCohorts.learnerTitle")}
      />
      <div className="grid gap-4">
        {cohorts.data.map((cohort) => {
          const learnerCount = cohort.members.filter((member) => member.memberRole === "learner").length;
          const localizedName = localizedText({ en: cohort.name, ms: cohort.nameMs, locale });
          return (
            <Card className="shadow-none" key={cohort.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge variant="info">{t(cohortStatusKey(cohort.status))}</Badge>
                    <CardTitle className="mt-3">{localizedName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{cohort.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div className="flex gap-3">
                    <CalendarClock aria-hidden="true" className="size-5 text-primary" />
                    <div>
                      <dt className="text-muted-foreground">{t("operations.myCohorts.schedule")}</dt>
                      <dd className="font-semibold">{formatDateTime(cohort.startAt, { dateStyle: "full", timeStyle: "short" })}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin aria-hidden="true" className="size-5 text-primary" />
                    <div>
                      <dt className="text-muted-foreground">{t("operations.myCohorts.venue")}</dt>
                      <dd className="font-semibold">{cohort.venue || t("operations.myCohorts.toBeConfirmed")}</dd>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone aria-hidden="true" className="size-5 text-primary" />
                    <div>
                      <dt className="text-muted-foreground">{t("operations.myCohorts.courseContact")}</dt>
                      <dd className="font-semibold">{cohort.contactName || t("operations.myCohorts.courseOperations")}{cohort.contactPhone ? ` · ${cohort.contactPhone}` : ""}</dd>
                    </div>
                  </div>
                  {instructor && (
                    <div className="flex gap-3">
                      <Users aria-hidden="true" className="size-5 text-primary" />
                      <div>
                        <dt className="text-muted-foreground">{t("operations.myCohorts.permittedRoster")}</dt>
                        <dd className="font-semibold">{learnerCount} {learnerCount === 1 ? t("operations.myCohorts.learner") : t("operations.myCohorts.learners")}</dd>
                      </div>
                    </div>
                  )}
                </dl>
                {cohort.preparationNotes && (
                  <div className="rounded-xl bg-primary-soft p-4">
                    <h2 className="font-semibold text-primary">{t("operations.myCohorts.preparation")}</h2>
                    <p className="mt-1 text-sm text-primary">{cohort.preparationNotes}</p>
                  </div>
                )}
                {instructor && <InstructorCohortReadiness cohortId={cohort.id} />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
