import { ArrowRight, CheckSquare2, FileText, PlayCircle, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/badge";
import { useTranslation } from "../../../lib/i18n";
import { resourceLanguageKey, resourceTypeKey } from "../../../lib/i18n/enum-labels";
import type { CourseResource } from "../model/resource-types";

const resourceIcons = {
  guide: ScrollText,
  checklist: CheckSquare2,
  pdf: FileText,
  youtube_video: PlayCircle,
};

export function LiveResourceRow({
  contextLabel,
  resource,
  to,
}: {
  contextLabel?: string;
  resource: CourseResource;
  to: string;
}) {
  const { t } = useTranslation();
  const Icon = resourceIcons[resource.type];
  const duration = resource.estimatedMinutes
    ? `${resource.estimatedMinutes} ${t("resource.minutes")}`
    : t("resource.quickReference");

  return (
    <Link
      className="group flex min-h-20 items-center gap-3 border-b px-3 py-3 transition-colors duration-200 last:border-b-0 hover:bg-primary-soft/45 active:bg-primary-soft sm:px-4"
      to={to}
    >
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold leading-snug">{resource.title}</span>
          <Badge>{t(resourceTypeKey(resource.type))}</Badge>
          <Badge variant="neutral">{t(resourceLanguageKey(resource.contentLanguage))}</Badge>
          {resource.featured && <Badge variant="info">{t("resource.featured")}</Badge>}
        </span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {(contextLabel ?? resource.topics.map((topic) => topic.name).join(", ")) || t("resource.generalBls")} · {duration}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
