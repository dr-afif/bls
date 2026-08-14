import { ArrowRight, CheckSquare2, FileText, PlayCircle, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../../../components/ui/badge";
import type { CourseResource } from "../model/resource-types";
import { resourceTypeLabels } from "../model/resource-types";

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
  const Icon = resourceIcons[resource.type];
  const duration = resource.estimatedMinutes ? `${resource.estimatedMinutes} min` : "Quick reference";

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
          <Badge>{resourceTypeLabels[resource.type]}</Badge>
          {resource.featured && <Badge variant="info">Featured</Badge>}
        </span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {(contextLabel ?? resource.topics.map((topic) => topic.name).join(", ")) || "General BLS"} · {duration}
        </span>
      </span>
      <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
