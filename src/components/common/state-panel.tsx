import {
  AlertCircle,
  Ban,
  Clock3,
  CloudOff,
  Inbox,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type StateKind =
  | "loading"
  | "empty"
  | "offline"
  | "expired"
  | "error"
  | "denied";

type StatePanelProps = {
  kind: StateKind;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  as?: "h1" | "h2";
  children?: ReactNode;
};

const stateContent: Record<
  StateKind,
  { title: string; description: string; icon: LucideIcon; tone: string }
> = {
  loading: {
    title: "Loading demo content",
    description: "Preparing the local prototype data for this screen.",
    icon: LoaderCircle,
    tone: "bg-primary-soft text-primary",
  },
  empty: {
    title: "Nothing here yet",
    description: "This area is ready for content in a later prototype iteration.",
    icon: Inbox,
    tone: "bg-muted text-muted-foreground",
  },
  offline: {
    title: "You appear to be offline",
    description:
      "The prototype shell remains available, but guides and teaching materials require a connection.",
    icon: CloudOff,
    tone: "bg-warning-soft text-warning",
  },
  expired: {
    title: "Companion access has expired",
    description:
      "Course references and new assessments are unavailable in this state.",
    icon: Clock3,
    tone: "bg-warning-soft text-warning",
  },
  error: {
    title: "We could not load this screen",
    description: "Try again. No fictional prototype data has been changed.",
    icon: AlertCircle,
    tone: "bg-destructive-soft text-destructive",
  },
  denied: {
    title: "Access is not available",
    description:
      "This demo role does not have permission to open the requested area.",
    icon: Ban,
    tone: "bg-destructive-soft text-destructive",
  },
};

export function StatePanel({
  actionLabel,
  as = "h2",
  children,
  compact = false,
  description,
  kind,
  onAction,
  title,
}: StatePanelProps) {
  const content = stateContent[kind];
  const Icon = content.icon;
  const isLoading = kind === "loading";
  const Heading = as;

  return (
    <Card
      aria-busy={isLoading}
      aria-live={isLoading ? "polite" : undefined}
      className={cn(
        "flex flex-col items-center justify-center p-6 text-center",
        compact ? "min-h-52" : "min-h-72",
      )}
      role={kind === "error" ? "alert" : "status"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-2xl",
          content.tone,
        )}
      >
        <Icon className={cn("size-6", isLoading && "animate-spin")} />
      </span>
      <Heading className="text-lg font-semibold">{title ?? content.title}</Heading>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description ?? content.description}
      </p>
      {children}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
