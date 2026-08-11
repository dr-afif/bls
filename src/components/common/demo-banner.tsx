import { FlaskConical } from "lucide-react";

import { cn } from "../../lib/utils";

type DemoBannerProps = {
  className?: string;
  compact?: boolean;
};

export function DemoBanner({ className, compact = false }: DemoBannerProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning-soft px-3 py-1.5 text-xs font-semibold text-warning",
        className,
      )}
      role="status"
    >
      <FlaskConical aria-hidden="true" className="size-3.5" />
      {compact ? "Prototype" : "Prototype · Demo data"}
    </div>
  );
}
