import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import type { Json } from "../../../lib/supabase/database.types";
import { FieldError } from "./resource-admin-ui";
import { contentFromDraftBody, textareaClassName } from "../model/resource-admin-form-utils";
import type { ResourceType } from "../model/resource-admin-types";

const baseSchema = z.object({
  contentBody: z.string(),
  guidelineSource: z.string().trim().min(2, "Add the guideline source.").max(180),
  guidelineYear: z.string().regex(/^\d{4}$/, "Enter a four-digit year."),
  summary: z.string().trim().min(10, "Add a concise summary.").max(600),
  title: z.string().trim().min(2, "Add a version title.").max(180),
  youtubeVideoId: z.string(),
});

type Values = z.infer<typeof baseSchema>;
export type VersionDraftValues = {
  content: Json | null;
  guidelineSource: string;
  guidelineYear: number;
  summary: string;
  title: string;
  youtubeVideoId: string | null;
};

export function VersionDraftForm({ disabled, initial, onSubmit, submitLabel, type }: {
  disabled?: boolean;
  initial?: Partial<Values>;
  onSubmit: (values: VersionDraftValues) => Promise<void> | void;
  submitLabel: string;
  type: ResourceType;
}) {
  const schema = baseSchema.superRefine((values, context) => {
    if ((type === "guide" || type === "checklist") && values.contentBody.trim().length < 2) context.addIssue({ code: "custom", message: "Add the clinical content.", path: ["contentBody"] });
    if (type === "youtube_video" && values.youtubeVideoId.trim().length < 6) context.addIssue({ code: "custom", message: "Add a valid YouTube video ID.", path: ["youtubeVideoId"] });
  });
  const form = useForm<Values>({
    defaultValues: { contentBody: "", guidelineSource: "", guidelineYear: String(new Date().getFullYear()), summary: "", title: "", youtubeVideoId: "", ...initial },
    resolver: zodResolver(schema),
  });

  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((values) => onSubmit({
    content: contentFromDraftBody(type, values.contentBody),
    guidelineSource: values.guidelineSource.trim(),
    guidelineYear: Number(values.guidelineYear),
    summary: values.summary,
    title: values.title,
    youtubeVideoId: type === "youtube_video" ? values.youtubeVideoId.trim() : null,
  }))}>
    <label className="text-sm font-semibold sm:col-span-2">Version title<Input className="mt-2" {...form.register("title")} /><FieldError>{form.formState.errors.title?.message}</FieldError></label>
    <label className="text-sm font-semibold sm:col-span-2">Summary<textarea className={textareaClassName} {...form.register("summary")} /><FieldError>{form.formState.errors.summary?.message}</FieldError></label>
    <label className="text-sm font-semibold">Guideline source<Input className="mt-2" {...form.register("guidelineSource")} /><FieldError>{form.formState.errors.guidelineSource?.message}</FieldError></label>
    <label className="text-sm font-semibold">Guideline year<Input className="mt-2" inputMode="numeric" {...form.register("guidelineYear")} /><FieldError>{form.formState.errors.guidelineYear?.message}</FieldError></label>
    {(type === "guide" || type === "checklist") && <label className="text-sm font-semibold sm:col-span-2">{type === "checklist" ? "Checklist items — one per line" : "Clinical guide content"}<textarea className={textareaClassName} {...form.register("contentBody")} /><FieldError>{form.formState.errors.contentBody?.message}</FieldError></label>}
    {type === "youtube_video" && <label className="text-sm font-semibold sm:col-span-2">YouTube video ID<Input className="mt-2" {...form.register("youtubeVideoId")} /><FieldError>{form.formState.errors.youtubeVideoId?.message}</FieldError></label>}
    {type === "pdf" && <p className="rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info sm:col-span-2">After saving this draft, upload its PDF on the version workspace. The private path is allocated by the server and cannot be replaced.</p>}
    <div className="border-t pt-4 sm:col-span-2"><Button disabled={disabled} type="submit"><Save aria-hidden="true" />{disabled ? "Saving…" : submitLabel}</Button></div>
  </form>;
}
