import { AlertCircle, CheckCircle2, CircleDashed, FileClock, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { cn } from "../../../lib/utils";
import type { QuestionVersionStatus, QuizVersionStatus } from "../model/quiz-admin-types";

export const selectClassName = "mt-2 min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground shadow-sm hover:border-primary/45 sm:text-sm";
export const textareaClassName = "mt-2 min-h-28 w-full rounded-xl border bg-card px-3 py-2 text-base text-foreground shadow-sm hover:border-primary/45 sm:text-sm";

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return <p className="mt-1 flex items-center gap-1 text-sm font-medium text-destructive" id={id}><AlertCircle aria-hidden="true" className="size-4" />{children}</p>;
}

export function AuthoringStatusBadge({ status }: { status: QuestionVersionStatus | QuizVersionStatus }) {
  const Icon = status === "published" ? CheckCircle2 : status === "approved" ? ShieldCheck : status === "draft" ? FileClock : CircleDashed;
  const variant = status === "published" || status === "approved" ? "success" : status === "draft" ? "warning" : "neutral";
  return <Badge variant={variant}><Icon aria-hidden="true" className="mr-1 size-3.5" />{status.replaceAll("_", " ")}</Badge>;
}

export function QuizAdminNav() {
  const items = [
    { label: "Quiz library", to: "/app/admin/quizzes" },
    { label: "Question bank", to: "/app/admin/questions" },
  ];
  return <nav aria-label="Assessment authoring" className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2">
    {items.map((item) => <NavLink className={({ isActive }) => cn("inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold", isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted")} end={item.to.endsWith("quizzes")} key={item.to} to={item.to}>{item.label}</NavLink>)}
  </nav>;
}

export function QuizAdminState({ query, empty, emptyDescription }: {
  empty?: boolean;
  emptyDescription?: string;
  query: { isError: boolean; isPending: boolean; refetch: () => unknown };
}) {
  if (query.isPending) return <StatePanel kind="loading" title="Loading assessment workspace" description="Checking the quiz records permitted for your administrator account." />;
  if (query.isError) return <StatePanel actionLabel="Try again" kind="error" onAction={() => void query.refetch()} title="Assessment records are unavailable" description="Check your connection and try again. No quiz content was changed." />;
  if (empty) return <StatePanel kind="empty" title="No assessment content yet" description={emptyDescription ?? "Create fictional, non-clinical content to begin."} />;
  return null;
}
