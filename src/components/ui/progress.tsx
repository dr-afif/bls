import { cn } from "../../lib/utils";

type ProgressProps = {
  className?: string;
  label: string;
  value: number;
};

export function Progress({ className, label, value }: ProgressProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {boundedValue}%
        </span>
      </div>
      <div
        aria-label={`${label}: ${boundedValue}%`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={boundedValue}
        className="h-2.5 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-accent transition-transform duration-300"
          style={{
            transform: `translateX(-${100 - boundedValue}%)`,
          }}
        />
      </div>
    </div>
  );
}
