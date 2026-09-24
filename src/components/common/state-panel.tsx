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

import { useTranslation } from "../../lib/i18n/use-translation";
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

const stateIcons: Record<StateKind, { icon: LucideIcon; tone: string }> = {
  loading: {
    icon: LoaderCircle,
    tone: "bg-primary-soft text-primary",
  },
  empty: {
    icon: Inbox,
    tone: "bg-muted text-muted-foreground",
  },
  offline: {
    icon: CloudOff,
    tone: "bg-warning-soft text-warning",
  },
  expired: {
    icon: Clock3,
    tone: "bg-warning-soft text-warning",
  },
  error: {
    icon: AlertCircle,
    tone: "bg-destructive-soft text-destructive",
  },
  denied: {
    icon: Ban,
    tone: "bg-destructive-soft text-destructive",
  },
};

const defaultTitles: Record<StateKind, string> = {
  loading: "Loading content",
  empty: "Nothing here yet",
  offline: "You appear to be offline",
  expired: "Companion access has expired",
  error: "We could not load this screen",
  denied: "Access is not available",
};

const defaultDescriptions: Record<StateKind, string> = {
  loading: "Preparing this screen.",
  empty: "This area is ready for content in a later prototype iteration.",
  offline:
    "The prototype shell remains available, but guides and teaching materials require a connection.",
  expired:
    "Course references and new assessments are unavailable in this state.",
  error: "Try again. No data has been changed.",
  denied:
    "This demo role does not have permission to open the requested area.",
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
  const { locale, t } = useTranslation();
  const visual = stateIcons[kind];
  const Icon = visual.icon;
  const isLoading = kind === "loading";
  const Heading = as;

  const resolvedTitle =
    title ??
    (locale === "ms"
      ? kind === "loading"
        ? t("state.loading")
        : kind === "error"
          ? t("state.error")
          : kind === "offline"
            ? t("state.offline")
            : kind === "empty"
              ? t("state.empty")
              : defaultTitles[kind]
      : defaultTitles[kind]);

  const resolvedDescription = description ?? defaultDescriptions[kind];

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
          visual.tone,
        )}
      >
        <Icon className={cn("size-6", isLoading && "animate-spin")} />
      </span>
      <Heading className="text-lg font-semibold">{resolvedTitle}</Heading>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {resolvedDescription}
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
