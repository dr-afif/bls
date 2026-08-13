import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "../features/auth/context/auth-context";
import { DemoSessionProvider } from "../features/demo/context/demo-session-context";
import { queryClient } from "../lib/query-client";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DemoSessionProvider>
          <RouterProvider
            future={{ v7_startTransition: true }}
            router={router}
          />
        </DemoSessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
