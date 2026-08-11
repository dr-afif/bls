import { useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { cn } from "../../../lib/utils";

const stateOptions = [
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "offline", label: "Offline" },
  { value: "expired", label: "Access expired" },
  { value: "error", label: "Error" },
  { value: "denied", label: "Access denied" },
] as const;

type StateKind = (typeof stateOptions)[number]["value"];

export function StatesPage() {
  const [selectedState, setSelectedState] = useState<StateKind>("loading");

  return (
    <div className="space-y-8">
      <PageHeader
        description="Reusable feedback patterns for key loading, access and recovery situations."
        eyebrow="Prototype library"
        title="Application state patterns"
      />

      <Card>
        <CardContent className="pt-5 sm:pt-6">
          <div
            aria-label="Choose a state to preview"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {stateOptions.map((option) => (
              <Button
                aria-pressed={selectedState === option.value}
                className={cn(
                  selectedState === option.value &&
                    "ring-2 ring-ring ring-offset-2",
                )}
                key={option.value}
                onClick={() => setSelectedState(option.value)}
                variant={
                  selectedState === option.value ? "secondary" : "outline"
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <StatePanel
        actionLabel={
          selectedState === "loading"
            ? undefined
            : selectedState === "empty"
              ? "Return to home"
              : "Try again"
        }
        kind={selectedState}
        onAction={() => setSelectedState("loading")}
      />
    </div>
  );
}
