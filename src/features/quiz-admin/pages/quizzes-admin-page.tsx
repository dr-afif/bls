import { CalendarCheck2, CheckCircle2, FilePlus2, LockKeyhole, ListChecks, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { AuthoringStatusBadge, QuizAdminNav, QuizAdminState } from "../components/quiz-admin-ui";
import { useQuizAdminCatalog, useQuizAdminMutations } from "../hooks/use-quiz-admin";

function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function QuizzesAdminPage() {
  const catalog = useQuizAdminCatalog();
  const { releasePostTest } = useQuizAdminMutations();
  const [notice, setNotice] = useState("");
  const postTests = useMemo(() => catalog.data?.quizzes.filter((quiz) => quiz.type === "post_test" && quiz.currentVersionId) ?? [], [catalog.data]);
  if (catalog.isPending || catalog.isError) return <QuizAdminState query={catalog} />;

  return <div className="space-y-6">
    <PageHeader action={<Button asChild><Link to="/app/admin/quizzes/new"><FilePlus2 aria-hidden="true" />New quiz</Link></Button>} description="Create immutable quiz versions from approved fictional questions, publish controlled configurations, and release post-tests after the physical course." eyebrow="Administrator workspace" title="Quizzes" />
    <QuizAdminNav />
    <p aria-live="polite" className="text-sm font-medium text-info">{notice}</p>
    {catalog.data?.quizzes.length === 0 ? <QuizAdminState empty emptyDescription="Create the first quiz after publishing at least one fictional question." query={catalog} /> : <div className="grid gap-4 xl:grid-cols-2">{catalog.data?.quizzes.map((quiz) => {
      const latest = quiz.versions[0];
      const current = quiz.versions.find((version) => version.id === quiz.currentVersionId);
      return <article className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5" key={quiz.id}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="primary">{quiz.type === "pre_test" ? "Pre-test" : "Post-test"}</Badge>{latest && <AuthoringStatusBadge status={latest.status} />}{current && latest?.id !== current.id && <Badge variant="neutral">Current v{current.versionNumber}</Badge>}</div><h2 className="mt-3 text-lg font-bold">{quiz.title}</h2><p className="mt-1 text-sm text-muted-foreground">{quiz.courseTitle} · {quiz.slug}</p></div><Button asChild variant="outline"><Link to={`/app/admin/quizzes/${quiz.id}`}>Manage quiz</Link></Button></div>{latest && <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3"><div><dt className="font-semibold">Latest version</dt><dd className="text-muted-foreground">Version {latest.versionNumber}</dd></div><div><dt className="font-semibold">Questions</dt><dd className="text-muted-foreground">{latest.questionVersionIds.length}</dd></div><div><dt className="font-semibold">Rules</dt><dd className="text-muted-foreground">{latest.timeLimitMinutes} min · {latest.attemptLimit} attempt{latest.attemptLimit === 1 ? "" : "s"}</dd></div></dl>}</article>;
    })}</div>}

    <section aria-labelledby="release-heading" className="space-y-4"><div><h2 className="flex items-center gap-2 text-xl font-bold" id="release-heading"><CalendarCheck2 aria-hidden="true" className="size-5 text-primary" />Post-test release</h2><p className="mt-1 text-sm text-muted-foreground">Release is irreversible in the normal workflow after attempts begin and is audit recorded. Only current published post-tests are listed.</p></div>
      {postTests.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Publish a post-test before releasing it to a cohort.</p> : <div className="grid gap-4">{catalog.data?.cohorts.map((cohort) => <Card className="shadow-none" key={cohort.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><UsersRound aria-hidden="true" className="size-5" />{cohort.name}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Course starts {date(cohort.startAt)}</p></div></div></CardHeader><CardContent className="space-y-3">{postTests.filter((quiz) => quiz.courseId === cohort.courseId).map((quiz) => {
        const released = catalog.data?.releases.some((release) => release.cohortId === cohort.id && release.quizVersionId === quiz.currentVersionId);
        return <div className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center" key={quiz.id}><div><p className="font-semibold">{quiz.title}</p><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">{released ? <CheckCircle2 aria-hidden="true" className="size-4 text-success" /> : <LockKeyhole aria-hidden="true" className="size-4 text-warning" />}{released ? "Released to this cohort" : "Not released"}</p></div><Button disabled={released || releasePostTest.isPending} onClick={() => void releasePostTest.mutateAsync({ cohortId: cohort.id, quizId: quiz.id }).then(() => setNotice(`${quiz.title} released to ${cohort.name}. The action was audit recorded.`)).catch(() => setNotice("The post-test could not be released. Confirm the quiz is current, published, and belongs to this cohort's course."))} variant={released ? "ghost" : "outline"}>{released ? <CheckCircle2 aria-hidden="true" /> : <ListChecks aria-hidden="true" />}{released ? "Released" : "Release post-test"}</Button></div>;
      })}</CardContent></Card>)}</div>}
    </section>
  </div>;
}
