import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border bg-card px-3 text-base text-foreground shadow-sm placeholder:text-muted-foreground hover:border-primary/45 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

