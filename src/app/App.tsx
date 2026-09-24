import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "../features/auth/context/auth-context";
import { DemoSessionProvider } from "../features/demo/context/demo-session-context";
import { I18nProvider } from "../lib/i18n/i18n-context";
import { queryClient } from "../lib/query-client";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <DemoSessionProvider>
            <RouterProvider
              future={{ v7_startTransition: true }}
              router={router}
            />
          </DemoSessionProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
