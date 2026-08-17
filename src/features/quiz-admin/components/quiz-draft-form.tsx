import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { AdminQuestion, QuizDraftValues } from "../model/quiz-admin-types";
import { quizDraftSchema } from "../model/quiz-admin-types";
import { FieldError, textareaClassName } from "./quiz-admin-ui";

function currentPublished(question: AdminQuestion) {
  return question.versions.find((version) => version.id === question.currentVersionId && version.status === "published");
}

export function QuizDraftForm({ defaultValues, pending, questions, submitLabel, onSubmit }: {
  defaultValues: QuizDraftValues;
  pending: boolean;
  questions: AdminQuestion[];
  submitLabel: string;
  onSubmit: (values: QuizDraftValues) => Promise<void>;
}) {
  const form = useForm<QuizDraftValues>({ defaultValues, resolver: zodResolver(quizDraftSchema) });
  const selected = useWatch({ control: form.control, name: "questionVersionIds" });
  const available = questions.flatMap((question) => {
    const version = currentPublished(question);
    return version ? [{ question, version }] : [];
  });
  const setSelected = (ids: string[]) => form.setValue("questionVersionIds", ids, { shouldDirty: true, shouldValidate: true });
  const move = (index: number, direction: -1 | 1) => {
    const next = [...selected];
    const other = index + direction;
    if (other < 0 || other >= next.length) return;
    [next[index], next[other]] = [next[other], next[index]];
    setSelected(next);
  };

  return <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">Quiz title<Input className="mt-2" {...form.register("title")} /><FieldError>{form.formState.errors.title?.message}</FieldError></label>
      <label className="text-sm font-semibold sm:col-span-2">Learner instructions<textarea className={textareaClassName} {...form.register("instructions")} /><FieldError>{form.formState.errors.instructions?.message}</FieldError></label>
      <label className="text-sm font-semibold">Passing score (%)<Input className="mt-2" max={100} min={0} type="number" {...form.register("passingScorePercent", { valueAsNumber: true })} /><FieldError>{form.formState.errors.passingScorePercent?.message}</FieldError></label>
      <label className="text-sm font-semibold">Time limit (minutes)<Input className="mt-2" max={240} min={1} type="number" {...form.register("timeLimitMinutes", { valueAsNumber: true })} /><FieldError>{form.formState.errors.timeLimitMinutes?.message}</FieldError></label>
      <label className="text-sm font-semibold">Attempt limit<Input className="mt-2" max={10} min={1} type="number" {...form.register("attemptLimit", { valueAsNumber: true })} /><FieldError>{form.formState.errors.attemptLimit?.message}</FieldError></label>
      <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-3 text-sm font-semibold"><input className="size-5" type="checkbox" {...form.register("randomizeOptions")} />Randomize option order per attempt</label>
      <label className="text-sm font-semibold">Available from <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2" type="datetime-local" {...form.register("availableFrom")} /></label>
      <label className="text-sm font-semibold">Available until <span className="font-normal text-muted-foreground">(optional)</span><Input className="mt-2" type="datetime-local" {...form.register("availableUntil")} /><FieldError>{form.formState.errors.availableUntil?.message}</FieldError></label>
    </div>

    <fieldset><legend className="text-sm font-semibold">Ordered quiz questions</legend><p className="mt-1 text-sm text-muted-foreground">Only current published question versions can be composed into a quiz. Order is frozen when a learner starts an attempt.</p>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2"><h3 className="text-sm font-semibold">Question bank</h3>{available.filter(({ version }) => !selected.includes(version.id)).map(({ question, version }) => <div className="flex items-start gap-3 rounded-xl border p-3" key={version.id}><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{version.prompt}</p><p className="mt-1 text-xs text-muted-foreground">{question.courseTitle} · v{version.versionNumber}</p></div><Button aria-label="Add question to quiz" onClick={() => setSelected([...selected, version.id])} size="icon" type="button" variant="outline"><Plus aria-hidden="true" /></Button></div>)}{available.length === selected.length && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">All published questions are selected.</p>}</div>
        <div className="space-y-2"><h3 className="text-sm font-semibold">Selected order</h3>{selected.map((id, index) => { const item = available.find(({ version }) => version.id === id); return <div className="flex items-start gap-2 rounded-xl border bg-muted/35 p-3" key={id}><Badge variant="neutral">{index + 1}</Badge><p className="min-w-0 flex-1 text-sm font-medium">{item?.version.prompt ?? "Published question unavailable"}</p><Button aria-label={`Move question ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)} size="icon" type="button" variant="ghost"><ArrowUp aria-hidden="true" /></Button><Button aria-label={`Move question ${index + 1} down`} disabled={index === selected.length - 1} onClick={() => move(index, 1)} size="icon" type="button" variant="ghost"><ArrowDown aria-hidden="true" /></Button><Button aria-label={`Remove question ${index + 1}`} onClick={() => setSelected(selected.filter((value) => value !== id))} size="icon" type="button" variant="ghost"><X aria-hidden="true" /></Button></div>; })}{selected.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Add at least one published question.</p>}<FieldError>{form.formState.errors.questionVersionIds?.message}</FieldError></div>
      </div>
    </fieldset>
    <div className="rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info"><strong>Fixed review policy:</strong> learners may receive score, pass state, and topic summary only. Correct answers and explanations remain hidden in this MVP.</div>
    <Button disabled={pending} type="submit"><Save aria-hidden="true" />{pending ? "Saving…" : submitLabel}</Button>
  </form>;
}
