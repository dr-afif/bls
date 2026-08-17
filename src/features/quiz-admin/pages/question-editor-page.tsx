import { ArrowLeft, CheckCircle2, CopyPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { QuestionDraftForm } from "../components/question-draft-form";
import { AuthoringStatusBadge, QuizAdminState, selectClassName } from "../components/quiz-admin-ui";
import { useQuizAdminCatalog, useQuizAdminMutations } from "../hooks/use-quiz-admin";
import type { QuestionDraftValues } from "../model/quiz-admin-types";

const emptyQuestion: QuestionDraftValues = { correctIndex: 0, options: [{ text: "" }, { text: "" }], prompt: "", referenceNote: "", topicIds: [], type: "single_best_answer" };

export function QuestionEditorPage() {
  const { questionId } = useParams();
  const creating = !questionId;
  const catalog = useQuizAdminCatalog();
  const mutations = useQuizAdminMutations();
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState("");
  const [notice, setNotice] = useState("");
  if (catalog.isPending || catalog.isError) return <QuizAdminState query={catalog} />;
  const question = creating ? undefined : catalog.data?.questions.find((item) => item.id === questionId);
  if (!creating && !question) return <QuizAdminState empty emptyDescription="This question is unavailable to your administrator account." query={catalog} />;
  const draft = question?.versions.find((version) => version.status === "draft");
  const displayed = draft ?? question?.versions.find((version) => version.id === question.currentVersionId) ?? question?.versions[0];
  const defaults: QuestionDraftValues = displayed ? { correctIndex: Math.max(0, displayed.options.findIndex((option) => option.isCorrect)), options: displayed.options.map((option) => ({ text: option.text })), prompt: displayed.prompt, referenceNote: displayed.referenceNote ?? "", topicIds: displayed.topicIds, type: displayed.type } : emptyQuestion;

  const save = async (values: QuestionDraftValues) => {
    setNotice("");
    try {
      if (creating) {
        if (!courseId) return setNotice("Choose the course this question belongs to.");
        const created = await mutations.createQuestion.mutateAsync({ ...values, courseId });
        navigate(`/app/admin/questions/${created.question_id}`, { replace: true });
      } else if (draft) {
        await mutations.updateQuestion.mutateAsync({ input: values, versionId: draft.id });
        setNotice("Draft saved atomically and audit recorded.");
      }
    } catch { setNotice("The question could not be saved. Check its topics, options, and correctness key, then try again."); }
  };

  return <div className="space-y-6"><PageHeader action={<Button asChild variant="ghost"><Link to="/app/admin/questions"><ArrowLeft aria-hidden="true" />Back to question bank</Link></Button>} description={creating ? "Create a fictional, non-clinical draft. Publishing freezes its prompt, options, key, and topic assignments." : "Edit only the active draft or branch a new version from the immutable published question."} eyebrow="Assessment authoring" title={creating ? "New question" : "Manage question"} />
    <p aria-live="polite" className="text-sm font-medium text-info">{notice}</p>
    {creating && <Card><CardHeader><CardTitle>Question ownership</CardTitle></CardHeader><CardContent><label className="block max-w-xl text-sm font-semibold">Course<select className={selectClassName} onChange={(event) => setCourseId(event.target.value)} value={courseId}><option value="">Select course</option>{catalog.data?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label></CardContent></Card>}
    {!creating && displayed && <div className="flex flex-wrap items-center gap-3"><AuthoringStatusBadge status={displayed.status} /><span className="text-sm text-muted-foreground">Version {displayed.versionNumber} · {question?.courseTitle}</span>{!draft && displayed.status === "published" && <Button disabled={mutations.createQuestionVersion.isPending} onClick={() => void mutations.createQuestionVersion.mutateAsync(question!.id).then(() => setNotice("New draft version created from the current published question.")).catch(() => setNotice("A new draft could not be created."))} variant="outline"><CopyPlus aria-hidden="true" />Create new version</Button>}</div>}
    {(creating || draft) ? <Card><CardHeader><CardTitle>{creating ? "Initial draft" : `Draft version ${draft?.versionNumber}`}</CardTitle></CardHeader><CardContent><QuestionDraftForm defaultValues={defaults} key={displayed?.id ?? "new"} onSubmit={save} pending={mutations.createQuestion.isPending || mutations.updateQuestion.isPending} submitLabel={creating ? "Create question draft" : "Save question draft"} topics={catalog.data?.topics ?? []} /></CardContent></Card> : displayed && <Card><CardHeader><CardTitle>Published immutable version</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap font-semibold">{displayed.prompt}</p><ol className="mt-4 space-y-2">{displayed.options.map((option) => <li className="flex items-center gap-2 rounded-xl border p-3 text-sm" key={option.id}>{option.isCorrect && <CheckCircle2 aria-hidden="true" className="size-5 text-success" />}{option.text}{option.isCorrect && <span className="sr-only">Correct option</span>}</li>)}</ol></CardContent></Card>}
    {draft && <div className="rounded-2xl border border-warning/30 bg-warning-soft p-4"><h2 className="font-bold text-warning">Publish immutable question version</h2><p className="mt-1 text-sm text-warning">Publishing freezes this prompt, correctness key, options, and topics. Later changes require a new version.</p><Button className="mt-4" disabled={mutations.publishQuestion.isPending} onClick={() => { if (!window.confirm("Publish this question version? Its content and correctness key will become immutable.")) return; void mutations.publishQuestion.mutateAsync(draft.id).then(() => setNotice("Question version published and audit recorded.")).catch(() => setNotice("The question could not be published. Check that it has active topics and exactly one correct option.")); }}><CheckCircle2 aria-hidden="true" />Publish question version</Button></div>}
  </div>;
}
