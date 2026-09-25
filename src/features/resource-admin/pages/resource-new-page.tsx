import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { PageHeader } from "../../../components/common/page-header";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { localizedText, useTranslation } from "../../../lib/i18n";
import { resourceAudienceKey, resourceLanguageKey, resourceTypeKey } from "../../../lib/i18n/enum-labels";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { FieldError, ResourceAdminState } from "../components/resource-admin-ui";
import { useAdminResourceCatalog, useAdminResourceMutations } from "../hooks/use-admin-resources";
import { contentFromDraftBody, selectClassName, textareaClassName } from "../model/resource-admin-form-utils";
import type { ResourceLanguage, ResourceType } from "../model/resource-admin-types";

const schema = z.object({
  audiences: z.array(z.enum(["learner", "instructor"])).min(1, "Choose at least one audience."),
  contentBody: z.string(),
  contentLanguage: z.enum(["en", "ms", "bilingual", "language_independent"]),
  courseId: z.string().uuid("Choose a course."),
  estimatedMinutes: z.string().regex(/^\d+$/, "Enter whole minutes."),
  featured: z.boolean(),
  guidelineSource: z.string().trim().min(2, "Add the guideline source.").max(180),
  guidelineYear: z.string().regex(/^\d{4}$/, "Enter a four-digit guideline year."),
  slug: z.string().trim().min(2, "Add a lowercase URL slug.").max(80, "Keep the slug under 80 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  stageIds: z.array(z.string().uuid()),
  summary: z.string().trim().min(10, "Add a concise summary.").max(600),
  title: z.string().trim().min(2, "Add a resource title.").max(180),
  topicIds: z.array(z.string().uuid()).min(1, "Choose at least one BLS topic."),
  type: z.enum(["guide", "checklist", "pdf", "youtube_video"]),
  youtubeVideoId: z.string(),
}).superRefine((values, context) => {
  if ((values.type === "guide" || values.type === "checklist") && values.contentBody.trim().length < 2) {
    context.addIssue({ code: "custom", message: "Add the initial clinical content.", path: ["contentBody"] });
  }
  if (values.type === "youtube_video" && values.youtubeVideoId.trim().length < 6) {
    context.addIssue({ code: "custom", message: "Add a valid YouTube video ID.", path: ["youtubeVideoId"] });
  }
  if (values.audiences.includes("instructor") && values.stageIds.length === 0) {
    context.addIssue({ code: "custom", message: "Instructor resources need at least one teaching stage.", path: ["stageIds"] });
  }
});

type Values = z.infer<typeof schema>;

const resourceTypeOptions: ResourceType[] = ["guide", "checklist", "pdf", "youtube_video"];
const contentLanguageOptions: ResourceLanguage[] = ["en", "ms", "bilingual", "language_independent"];

export function ResourceNewPage() {
  const { t, locale } = useTranslation();
  const access = useAccountAccess();
  const catalog = useAdminResourceCatalog();
  const { create } = useAdminResourceMutations();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const form = useForm<Values>({
    defaultValues: {
      audiences: ["learner"],
      contentBody: "",
      contentLanguage: "en",
      courseId: "",
      estimatedMinutes: "5",
      featured: false,
      guidelineSource: "",
      guidelineYear: String(new Date().getFullYear()),
      slug: "",
      stageIds: [],
      summary: "",
      title: "",
      topicIds: [],
      type: "guide",
      youtubeVideoId: "",
    },
    resolver: zodResolver(schema),
  });
  const type = useWatch({ control: form.control, name: "type" });

  if (catalog.isPending || catalog.isError) return <ResourceAdminState query={catalog} />;

  const submit = form.handleSubmit(async (values) => {
    const organizationId = access.data?.profile?.organizationId;
    if (!organizationId) return setNotice(t("operations.cohorts.noOrg"));
    setNotice("");
    try {
      const created = await create.mutateAsync({
        audiences: values.audiences,
        contentLanguage: values.contentLanguage,
        courseId: values.courseId,
        estimatedMinutes: Number(values.estimatedMinutes),
        featured: values.featured,
        guidelineSource: values.guidelineSource.trim(),
        guidelineYear: Number(values.guidelineYear),
        organizationId,
        slug: values.slug,
        stageIds: values.stageIds,
        summary: values.summary,
        title: values.title,
        topicIds: values.topicIds,
        type: values.type,
        versionContent: contentFromDraftBody(values.type, values.contentBody),
        youtubeVideoId: values.type === "youtube_video" ? values.youtubeVideoId.trim() : null,
      });
      navigate(`/app/admin/resources/${created.resourceId}/versions/${created.versionId}`, { replace: true });
    } catch {
      setNotice(t("resourceAdmin.new.failedNotice"));
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button asChild variant="ghost">
            <Link to="/app/admin/resources">
              <ArrowLeft aria-hidden="true" />
              {t("resourceAdmin.new.backToResources")}
            </Link>
          </Button>
        }
        description={t("resourceAdmin.new.description")}
        eyebrow="Administrator workspace"
        title={t("resourceAdmin.new.title")}
      />
      <p aria-live="polite" className="text-sm font-medium text-destructive">{notice}</p>
      <form className="space-y-6" onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("resourceAdmin.new.resourceIdentity")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.resourceTitle")}
              <Input aria-describedby="title-error" className="mt-2" {...form.register("title")} />
            </label>
            <FieldError id="title-error">{form.formState.errors.title?.message}</FieldError>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.urlSlug")}
              <Input aria-describedby="slug-error" className="mt-2" placeholder="adult-cpr-checklist" {...form.register("slug")} />
            </label>
            <FieldError id="slug-error">{form.formState.errors.slug?.message}</FieldError>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.course")}
              <select className={selectClassName} {...form.register("courseId")}>
                <option value="">{t("resourceAdmin.new.selectCourse")}</option>
                {catalog.data?.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {localizedText({ en: course.name, ms: course.titleMs, locale })}
                  </option>
                ))}
              </select>
              <FieldError>{form.formState.errors.courseId?.message}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.contentLanguage")}
              <select className={selectClassName} {...form.register("contentLanguage")}>
                {contentLanguageOptions.map((lang) => (
                  <option key={lang} value={lang}>
                    {t(resourceLanguageKey(lang))}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.resourceType")}
              <select className={selectClassName} {...form.register("type")}>
                {resourceTypeOptions.map((value) => (
                  <option key={value} value={value}>
                    {t(resourceTypeKey(value))}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.estimatedMinutes")}
              <Input className="mt-2" inputMode="numeric" {...form.register("estimatedMinutes")} />
              <FieldError>{form.formState.errors.estimatedMinutes?.message}</FieldError>
            </label>
            <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border px-3 text-sm font-semibold sm:col-span-2">
              <input className="size-5" type="checkbox" {...form.register("featured")} />
              {t("resourceAdmin.new.featureLibrary")}
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("resourceAdmin.new.audienceAndDiscovery")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-3">
            <fieldset>
              <legend className="text-sm font-semibold">{t("resourceAdmin.resources.audiences")}</legend>
              <div className="mt-2 space-y-2">
                {(["learner", "instructor"] as const).map((audience) => (
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={audience}>
                    <input className="size-5" type="checkbox" value={audience} {...form.register("audiences")} />
                    {t(resourceAudienceKey(audience))}
                  </label>
                ))}
              </div>
              <FieldError>{form.formState.errors.audiences?.message}</FieldError>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">{t("resourceAdmin.taxonomy.topics")}</legend>
              <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                {catalog.data?.topics.filter((topic) => topic.active).map((topic) => (
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={topic.id}>
                    <input className="size-5" type="checkbox" value={topic.id} {...form.register("topicIds")} />
                    {topic.name}
                  </label>
                ))}
              </div>
              <FieldError>{form.formState.errors.topicIds?.message}</FieldError>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">{t("resourceAdmin.taxonomy.stages")}</legend>
              <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
                {catalog.data?.stages.filter((stage) => stage.active).map((stage) => (
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm" key={stage.id}>
                    <input className="size-5" type="checkbox" value={stage.id} {...form.register("stageIds")} />
                    {stage.name}
                  </label>
                ))}
              </div>
              <FieldError>{form.formState.errors.stageIds?.message}</FieldError>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("resourceAdmin.new.initialVersion")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">
              {t("resourceAdmin.new.summary")}
              <textarea className={textareaClassName} {...form.register("summary")} />
              <FieldError>{form.formState.errors.summary?.message}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.guidelineSource")}
              <Input className="mt-2" placeholder="e.g. AHA Guidelines" {...form.register("guidelineSource")} />
              <FieldError>{form.formState.errors.guidelineSource?.message}</FieldError>
            </label>
            <label className="text-sm font-semibold">
              {t("resourceAdmin.new.guidelineYear")}
              <Input className="mt-2" inputMode="numeric" {...form.register("guidelineYear")} />
              <FieldError>{form.formState.errors.guidelineYear?.message}</FieldError>
            </label>
            {(type === "guide" || type === "checklist") && (
              <label className="text-sm font-semibold sm:col-span-2">
                {type === "checklist" ? t("resourceAdmin.new.checklistItems") : t("resourceAdmin.new.guideContent")}
                <textarea className={textareaClassName} {...form.register("contentBody")} />
                <FieldError>{form.formState.errors.contentBody?.message}</FieldError>
              </label>
            )}
            {type === "youtube_video" && (
              <label className="text-sm font-semibold sm:col-span-2">
                {t("resourceAdmin.new.youtubeVideoId")}
                <Input className="mt-2" {...form.register("youtubeVideoId")} />
                <FieldError>{form.formState.errors.youtubeVideoId?.message}</FieldError>
              </label>
            )}
            {type === "pdf" && (
              <p className="rounded-xl border border-info/25 bg-info-soft p-4 text-sm text-info sm:col-span-2">
                {t("resourceAdmin.new.pdfNotice")}
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button disabled={create.isPending} type="submit">
            <Save aria-hidden="true" />
            {create.isPending ? t("resourceAdmin.new.creating") : t("resourceAdmin.new.createDraft")}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/app/admin/resources">{t("common.cancel")}</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
