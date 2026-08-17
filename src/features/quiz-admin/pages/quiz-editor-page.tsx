import { ArrowLeft, CheckCircle2, CopyPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { QuizDraftForm } from "../components/quiz-draft-form";
import { AuthoringStatusBadge, QuizAdminState, selectClassName } from "../components/quiz-admin-ui";
import { useQuizAdminCatalog, useQuizAdminMutations } from "../hooks/use-quiz-admin";
import type { QuizDraftValues, QuizType } from "../model/quiz-admin-types";

const emptyQuiz: QuizDraftValues = { attemptLimit: 1, availableFrom: "", availableUntil: "", instructions: "", passingScorePercent: 80, questionVersionIds: [], randomizeOptions: true, timeLimitMinutes: 15, title: "" };
function localDate(value: string | null) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }

export function QuizEditorPage() {
  const { quizId } = useParams();
  const creating = !quizId;
  const catalog = useQuizAdminCatalog();
  const mutations = useQuizAdminMutations();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<QuizType>("pre_test");
  const [notice, setNotice] = useState("");
  if (catalog.isPending || catalog.isError) return <QuizAdminState query={catalog} />;
  const quiz = creating ? undefined : catalog.data?.quizzes.find((item) => item.id === quizId);
  if (!creating && !quiz) return <QuizAdminState empty emptyDescription="This quiz is unavailable to your administrator account." query={catalog} />;
  const draft = quiz?.versions.find((version) => version.status === "draft");
  const displayed = draft ?? quiz?.versions.find((version) => version.id === quiz.currentVersionId) ?? quiz?.versions[0];
  const defaults: QuizDraftValues = displayed ? { attemptLimit: displayed.attemptLimit, availableFrom: localDate(displayed.availableFrom), availableUntil: localDate(displayed.availableUntil), instructions: displayed.instructions, passingScorePercent: displayed.passingScorePercent, questionVersionIds: displayed.questionVersionIds, randomizeOptions: displayed.randomizeOptions, timeLimitMinutes: displayed.timeLimitMinutes, title: displayed.title } : emptyQuiz;

  const save = async (values: QuizDraftValues) => {
    setNotice("");
    try {
      if (creating) {
        if (!courseId || !slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)) return setNotice("Choose a course and enter a lowercase hyphenated slug.");
        const created = await mutations.createQuiz.mutateAsync({ ...values, courseId, slug, type });
        navigate(`/app/admin/quizzes/${created.quiz_id}`, { replace: true });
      } else if (draft) {
        await mutations.updateQuiz.mutateAsync({ input: values, versionId: draft.id });
        setNotice("Quiz draft saved atomically and audit recorded.");
      }
    } catch { setNotice("The quiz could not be saved. Check its unique slug, rules, availability window, and published questions."); }
  };

  const questions = (catalog.data?.questions ?? []).filter((question) => question.courseId === (quiz?.courseId ?? courseId));
  return <div className="space-y-6"><PageHeader action={<Button asChild variant="ghost"><Link to="/app/admin/quizzes"><ArrowLeft aria-hidden="true" />Back to quizzes</Link></Button>} description={creating ? "Create a controlled draft from published fictional questions. Publishing freezes its rules and composition." : "Edit the active draft or branch a new version from the current immutable quiz."} eyebrow="Assessment authoring" title={creating ? "New quiz" : quiz?.title ?? "Manage quiz"} />
    <p aria-live="polite" className="text-sm font-medium text-info">{notice}</p>
    {creating && <Card><CardHeader><CardTitle>Stable quiz identity</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Course<select className={selectClassName} onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Select course</option>{catalog.data?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label className="text-sm font-semibold">Quiz type<select className={selectClassName} onChange={(event) => setType(event.target.value as QuizType)} value={type}><option value="pre_test">Pre-test</option><option value="post_test">Post-test</option></select></label><label className="text-sm font-semibold">URL slug<Input className="mt-2" onChange={(event) => setSlug(event.target.value)} placeholder="adult-bls-pre-test" value={slug} /></label></CardContent></Card>}
    {!creating && displayed && <div className="flex flex-wrap items-center gap-3"><AuthoringStatusBadge status={displayed.status} /><span className="text-sm text-muted-foreground">Version {displayed.versionNumber} · {quiz?.courseTitle} · {quiz?.type === "pre_test" ? "Pre-test" : "Post-test"}</span>{!draft && displayed.status === "published" && <Button disabled={mutations.createQuizVersion.isPending} onClick={() => void mutations.createQuizVersion.mutateAsync(quiz!.id).then(() => setNotice("New quiz draft created from the current published version.")).catch(() => setNotice("A new quiz draft could not be created."))} variant="outline"><CopyPlus aria-hidden="true" />Create new version</Button>}</div>}
    {(creating || draft) ? <Card><CardHeader><CardTitle>{creating ? "Initial quiz draft" : `Draft version ${draft?.versionNumber}`}</CardTitle></CardHeader><CardContent><QuizDraftForm defaultValues={defaults} key={displayed?.id ?? `${courseId}-new`} onSubmit={save} pending={mutations.createQuiz.isPending || mutations.updateQuiz.isPending} questions={questions} submitLabel={creating ? "Create quiz draft" : "Save quiz draft"} /></CardContent></Card> : displayed && <Card><CardHeader><CardTitle>Published immutable configuration</CardTitle></CardHeader><CardContent><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="font-semibold">Questions</dt><dd className="text-muted-foreground">{displayed.questionVersionIds.length}</dd></div><div><dt className="font-semibold">Passing score</dt><dd className="text-muted-foreground">{displayed.passingScorePercent}%</dd></div><div><dt className="font-semibold">Rules</dt><dd className="text-muted-foreground">{displayed.timeLimitMinutes} min · {displayed.attemptLimit} attempt{displayed.attemptLimit === 1 ? "" : "s"}</dd></div></dl><p className="mt-4 whitespace-pre-wrap rounded-xl border p-4 text-sm">{displayed.instructions}</p></CardContent></Card>}
    {draft && <div className="rounded-2xl border border-warning/30 bg-warning-soft p-4"><h2 className="font-bold text-warning">Publish immutable quiz version</h2><p className="mt-1 text-sm text-warning">Publishing freezes the learner instructions, limits, availability, option randomization, and ordered question-version composition.</p><Button className="mt-4" disabled={mutations.publishQuiz.isPending} onClick={() => { if (!window.confirm("Publish this quiz version? Its rules and question composition will become immutable.")) return; void mutations.publishQuiz.mutateAsync(draft.id).then(() => setNotice("Quiz version published and audit recorded.")).catch(() => setNotice("The quiz could not be published. Confirm every selected question is current and published.")); }}><CheckCircle2 aria-hidden="true" />Publish quiz version</Button></div>}
  </div>;
}
