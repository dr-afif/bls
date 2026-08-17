import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { FieldError } from "./resource-admin-ui";
import {
  resourceTaxonomySchema,
  slugifyTaxonomyName,
  type ResourceTaxonomyFormValues,
} from "../model/resource-taxonomy-form-utils";
import type { ResourceTaxonomyItem, ResourceTaxonomyKind } from "../model/resource-taxonomy-types";
import { textareaClassName } from "../model/resource-admin-form-utils";

type Props = {
  busy: boolean;
  item?: ResourceTaxonomyItem;
  kind: ResourceTaxonomyKind;
  onCancel?: () => void;
  onSubmit: (values: ResourceTaxonomyFormValues & { slug: string }) => Promise<void>;
};

export function TaxonomyItemForm({ busy, item, kind, onCancel, onSubmit }: Props) {
  const formId = `${kind}-${item?.id ?? "create"}`;
  const form = useForm<ResourceTaxonomyFormValues>({
    defaultValues: {
      description: item?.description ?? "",
      displayOrder: String(item?.displayOrder ?? 0),
      name: item?.name ?? "",
    },
    resolver: zodResolver(resourceTaxonomySchema),
  });
  const name = useWatch({ control: form.control, name: "name" });
  const slug = item?.slug ?? slugifyTaxonomyName(name);
  const submit = form.handleSubmit(async (values) => {
    if (!slug) {
      form.setError("name", { message: "Use a name containing letters or numbers." });
      return;
    }
    await onSubmit({ ...values, slug });
    if (!item) form.reset({ description: "", displayOrder: "0", name: "" });
  });

  return <form className="grid gap-4 rounded-xl border bg-muted/25 p-4" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
      <label className="text-sm font-semibold">Name<Input aria-describedby={`${formId}-name-error`} className="mt-2" maxLength={100} {...form.register("name")} /></label>
      <label className="text-sm font-semibold">Display order<Input aria-describedby={`${formId}-order-error`} className="mt-2" inputMode="numeric" min={0} type="number" {...form.register("displayOrder")} /></label>
      <FieldError id={`${formId}-name-error`}>{form.formState.errors.name?.message}</FieldError>
      <FieldError id={`${formId}-order-error`}>{form.formState.errors.displayOrder?.message}</FieldError>
    </div>
    <label className="text-sm font-semibold">Description <span className="font-normal text-muted-foreground">(optional)</span><textarea className={textareaClassName} maxLength={500} rows={3} {...form.register("description")} /><FieldError>{form.formState.errors.description?.message}</FieldError></label>
    <div aria-live="polite" className="rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Stable slug:</span> {slug || "generated-from-name"}{item && <span> · cannot be changed after creation</span>}</div>
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy} type="submit"><Save aria-hidden="true" />{busy ? "Saving…" : item ? "Save changes" : `Add ${kind === "topic" ? "topic" : "stage"}`}</Button>
      {onCancel && <Button disabled={busy} onClick={onCancel} type="button" variant="ghost"><X aria-hidden="true" />Cancel</Button>}
    </div>
  </form>;
}
