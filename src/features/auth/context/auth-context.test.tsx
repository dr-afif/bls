import type { SupabaseClient } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import { AuthProvider, useAuth } from "./auth-context";

function Probe() {
  const { signOut, state } = useAuth();
  return (
    <div>
      <span>{state.status}</span>
      <button onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}

function wrapper(queryClient: QueryClient, client: SupabaseClient<Database>) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider client={client}>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("AuthProvider", () => {
  it("restores a signed-out session, clears cached data, and unsubscribes", async () => {
    const unsubscribe = vi.fn();
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe } },
        }),
        signOut,
      },
    } as unknown as SupabaseClient<Database>;
    const queryClient = new QueryClient();
    queryClient.setQueryData(["private"], { value: true });
    const view = render(<Probe />, { wrapper: wrapper(queryClient, client) });

    expect(await screen.findByText("signed_out")).toBeInTheDocument();
    await act(async () => screen.getByRole("button", { name: "Sign out" }).click());
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(queryClient.getQueryData(["private"])).toBeUndefined();

    view.unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
