import { FlaskConical } from "lucide-react";

import { useTranslation } from "../../lib/i18n/use-translation";
import { cn } from "../../lib/utils";

type DemoBannerProps = {
  className?: string;
  compact?: boolean;
};

export function DemoBanner({ className, compact = false }: DemoBannerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning",
        className,
      )}
      role="status"
    >
      <FlaskConical aria-hidden="true" className="size-3.5" />
      {compact ? t("shell.prototypeTitle") : `${t("shell.prototypeTitle")} · ${t("shell.demoData")}`}
    </div>
  );
}
