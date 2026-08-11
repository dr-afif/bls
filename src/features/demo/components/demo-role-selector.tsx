import { Check, GraduationCap, Presentation, ShieldCheck } from "lucide-react";

import { cn } from "../../../lib/utils";
import {
  demoRoleLabels,
  type DemoRole,
} from "../model/demo-role";

type DemoRoleSelectorProps = {
  value: DemoRole;
  onChange: (role: DemoRole) => void;
};

const roleOptions: Array<{
  role: DemoRole;
  description: string;
  note: string;
  icon: typeof GraduationCap;
}> = [
  {
    role: "learner",
    description: "Course details, practical guides, quizzes and results.",
    note: "Mobile-first field guide",
    icon: GraduationCap,
  },
  {
    role: "instructor",
    description: "Teaching materials, assigned cohorts and readiness.",
    note: "Mobile and tablet teaching kit",
    icon: Presentation,
  },
  {
    role: "administrator",
    description: "People, cohorts, resources, quizzes and results.",
    note: "Desktop-first operations",
    icon: ShieldCheck,
  },
];

export function DemoRoleSelector({
  onChange,
  value,
}: DemoRoleSelectorProps) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Choose a demo role</legend>
      <p className="mt-1 text-sm text-muted-foreground">
        This changes prototype labels only. It does not sign you in or grant
        access.
      </p>
      <div className="mt-4 grid gap-3" role="radiogroup">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const selected = option.role === value;

          return (
            <label
              className={cn(
                "relative flex min-h-24 cursor-pointer items-start gap-4 rounded-2xl border bg-card p-4 transition-colors duration-200 hover:border-primary/45 hover:bg-primary-soft/45",
                selected && "border-primary bg-primary-soft/60",
              )}
              key={option.role}
            >
              <input
                checked={selected}
                className="sr-only"
                name="demo-role"
                onChange={() => onChange(option.role)}
                type="radio"
                value={option.role}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground",
                  selected && "bg-primary text-primary-foreground",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    {demoRoleLabels[option.role]}
                  </span>
                  {selected && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check aria-hidden="true" className="size-3.5" />
                      Selected
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {option.description}
                </span>
                <span className="mt-2 block text-xs font-medium text-primary">
                  {option.note}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
