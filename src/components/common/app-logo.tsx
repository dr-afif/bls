import { HeartPulse } from "lucide-react";

import { cn } from "../../lib/utils";

type AppLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AppLogo({ className, compact = false }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
      >
        <HeartPulse className="size-6" strokeWidth={2} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-base font-bold tracking-tight">
            BLS Course Companion
          </span>
          <span className="block text-xs font-medium text-muted-foreground">
            Physical-course companion
          </span>
        </span>
      )}
    </div>
  );
}
