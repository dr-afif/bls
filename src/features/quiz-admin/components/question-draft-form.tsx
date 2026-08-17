import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, Save, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { QuestionDraftValues, QuizAdminCatalog } from "../model/quiz-admin-types";
import { questionDraftSchema } from "../model/quiz-admin-types";
import { FieldError, selectClassName, textareaClassName } from "./quiz-admin-ui";

export function QuestionDraftForm({ defaultValues, pending, submitLabel, topics, onSubmit }: {
  defaultValues: QuestionDraftValues;
  pending: boolean;
  submitLabel: string;
  topics: QuizAdminCatalog["topics"];
  onSubmit: (values: QuestionDraftValues) => Promise<void>;
}) {
  const form = useForm<QuestionDraftValues>({ defaultValues, resolver: zodResolver(questionDraftSchema) });
  const fields = useFieldArray({ control: form.control, name: "options" });
  const type = useWatch({ control: form.control, name: "type" });
  const correctIndex = useWatch({ control: form.control, name: "correctIndex" });

  useEffect(() => {
    if (type !== "true_false") return;
    fields.replace([{ text: "True" }, { text: "False" }]);
    form.setValue("correctIndex", 0, { shouldValidate: true });
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  return <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div>
        <label className="text-sm font-semibold">Question prompt<textarea aria-describedby="prompt-error" className={textareaClassName} {...form.register("prompt")} /></label>
        <FieldError id="prompt-error">{form.formState.errors.prompt?.message}</FieldError>
      </div>
      <div>
        <label className="text-sm font-semibold">Question type<select className={selectClassName} {...form.register("type")}><option value="single_best_answer">Single best answer</option><option value="true_false">True or false</option></select></label>
        <p className="mt-2 text-xs text-muted-foreground">The MVP uses one single-selection interaction for both supported types.</p>
      </div>
    </div>

    <fieldset><legend className="text-sm font-semibold">Answer options and correctness key</legend>
      <p className="mt-1 text-sm text-muted-foreground">The correctness key is administrator-only and is never returned in learner attempt payloads.</p>
      <div className="mt-3 space-y-3">{fields.fields.map((field, index) => <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] sm:items-start" key={field.id}>
        <label className="flex min-h-11 items-center justify-center rounded-lg border bg-muted" title="Mark as correct"><input aria-label={`Mark option ${index + 1} as correct`} checked={correctIndex === index} className="size-5" name="correct-option" onChange={() => form.setValue("correctIndex", index, { shouldDirty: true, shouldValidate: true })} type="radio" /></label>
        <label className="text-sm font-semibold">Option {index + 1}<Input className="mt-2" {...form.register(`options.${index}.text`)} /><FieldError>{form.formState.errors.options?.[index]?.text?.message}</FieldError></label>
        <Button aria-label={`Remove option ${index + 1}`} disabled={type === "true_false" || fields.fields.length <= 2} onClick={() => fields.remove(index)} size="icon" type="button" variant="ghost"><Trash2 aria-hidden="true" /></Button>
      </div>)}</div>
      <FieldError>{form.formState.errors.options?.root?.message ?? form.formState.errors.correctIndex?.message}</FieldError>
      {type === "single_best_answer" && <Button className="mt-3" disabled={fields.fields.length >= 8} onClick={() => fields.append({ text: "" })} type="button" variant="outline"><CirclePlus aria-hidden="true" />Add option</Button>}
    </fieldset>

    <fieldset><legend className="text-sm font-semibold">BLS topics</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{topics.filter((topic) => topic.active || defaultValues.topicIds.includes(topic.id)).map((topic) => <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={topic.id}><input className="size-5" disabled={!topic.active} type="checkbox" value={topic.id} {...form.register("topicIds")} />{topic.name}{!topic.active ? " (Inactive)" : ""}</label>)}</div><FieldError>{form.formState.errors.topicIds?.message}</FieldError></fieldset>
    <label className="block text-sm font-semibold">Reference note <span className="font-normal text-muted-foreground">(optional; administrator-only)</span><textarea className={textareaClassName} {...form.register("referenceNote")} /></label>
    <Button disabled={pending} type="submit"><Save aria-hidden="true" />{pending ? "Saving…" : submitLabel}</Button>
  </form>;
}
