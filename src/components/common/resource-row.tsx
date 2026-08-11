import {
  ArrowRight,
  CheckSquare2,
  FileText,
  PlayCircle,
  ScrollText,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { DemoResource } from "../../features/prototype/data/types";
import { Badge } from "../ui/badge";

const resourceIcons = {
  guide: ScrollText,
  checklist: CheckSquare2,
  document: FileText,
  video: PlayCircle,
};

const resourceLabels: Record<DemoResource["type"], string> = {
  guide: "Guide",
  checklist: "Checklist",
  document: "Document",
  video: "Video",
};

type ResourceRowProps = {
  resource: DemoResource;
  to: string;
  contextLabel?: string;
};

export function ResourceRow({
  contextLabel,
  resource,
  to,
}: ResourceRowProps) {
  const Icon = resourceIcons[resource.type];

  return (
    <Link
      className="group flex min-h-20 items-center gap-3 border-b px-3 py-3 transition-colors duration-200 last:border-b-0 hover:bg-primary-soft/45 active:bg-primary-soft sm:px-4"
      to={to}
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary"
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold leading-snug">{resource.title}</span>
          <Badge>{resourceLabels[resource.type]}</Badge>
        </span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">
          {contextLabel ?? resource.topic} · {resource.duration}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Link>
  );
}

