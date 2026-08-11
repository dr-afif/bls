import { Suspense, type ReactNode } from "react";

import { StatePanel } from "./state-panel";

export function RouteLoader({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <StatePanel kind="loading" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
