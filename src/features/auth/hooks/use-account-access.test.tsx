import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import * as authContext from "../context/auth-context";
import * as accountAccessRepo from "../data/account-access-repository";
import { useAccountAccess } from "./use-account-access";

describe("useAccountAccess", () => {
  it("uses refetchOnWindowFocus: 'always' and refetches on window focus", async () => {
    const userId = "33000000-0000-4000-8000-000000000001";
    const mockClient = {} as unknown as SupabaseClient<Database>;

    vi.spyOn(authContext, "useAuth").mockReturnValue({
      client: mockClient,
      state: {
        status: "signed_in",
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },

      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    let accessResponse: Awaited<ReturnType<typeof accountAccessRepo.getAccountAccess>> = {
      profile: {
        accountStatus: "active",
        fullName: "Test User",
        organizationId: "10000000-0000-0000-0000-000000000001",
      },
      roles: ["learner"],
    };


    const getAccessSpy = vi
      .spyOn(accountAccessRepo, "getAccountAccess")
      .mockImplementation(async () => accessResponse);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false, // Global setting is false!
        },
      },
    });

    function wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useAccountAccess(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.profile?.accountStatus).toBe("active");
    expect(getAccessSpy).toHaveBeenCalledTimes(1);

    // Simulate administrator suspending user while tab was in background
    accessResponse = {
      profile: {
        accountStatus: "suspended" as const,
        fullName: "Test User",
        organizationId: "10000000-0000-0000-0000-000000000001",
      },
      roles: ["learner" as const],
    };

    // Trigger window focus via focusManager
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    // Verify targeted query refetched despite global refetchOnWindowFocus: false
    await waitFor(() => {
      expect(result.current.data?.profile?.accountStatus).toBe("suspended");
    });
    expect(getAccessSpy).toHaveBeenCalledTimes(2);
  });

  it("updates guarded UI to suspended or expired state when account status changes on window focus", async () => {
    const userId = "33000000-0000-4000-8000-000000000002";
    const mockClient = {} as unknown as SupabaseClient<Database>;

    vi.spyOn(authContext, "useAuth").mockReturnValue({
      client: mockClient,
      state: {
        status: "signed_in",
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },

      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    let currentStatus: "active" | "suspended" | "expired" = "active";

    vi.spyOn(accountAccessRepo, "getAccountAccess").mockImplementation(async () => ({
      profile: {
        accountStatus: currentStatus,
        fullName: "Test Learner",
        organizationId: "10000000-0000-0000-0000-000000000001",
      },
      roles: ["learner" as const],
    }));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, refetchOnWindowFocus: false },
      },
    });

    function TestComponent() {
      const access = useAccountAccess();
      if (access.isPending) return <div>Loading access...</div>;
      if (access.data?.profile?.accountStatus === "suspended") {
        return <div>Account suspended</div>;
      }
      if (access.data?.profile?.accountStatus === "expired") {
        return <div>Account access expired</div>;
      }
      return <div>Protected learning dashboard</div>;
    }

    const { render, screen } = await import("@testing-library/react");
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Protected learning dashboard")).toBeInTheDocument();

    // Administrator suspends account in background
    currentStatus = "suspended";
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(await screen.findByText("Account suspended")).toBeInTheDocument();

    // Access expires
    currentStatus = "expired";
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(await screen.findByText("Account access expired")).toBeInTheDocument();
  });

  it("proves post-invite pending_verification blocks access until email confirmation activates the account", async () => {
    const userId = "33000000-0000-4000-8000-000000000003";
    const mockClient = {} as unknown as SupabaseClient<Database>;

    vi.spyOn(authContext, "useAuth").mockReturnValue({
      client: mockClient,
      state: {
        status: "signed_in",
        session: { user: { id: userId } } as unknown as Session,
        user: { id: userId } as unknown as User,
      },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    let accountStatus: "pending_verification" | "active" = "pending_verification";

    vi.spyOn(accountAccessRepo, "getAccountAccess").mockImplementation(async () => ({
      profile: {
        accountStatus,
        fullName: "Invited Learner",
        organizationId: "10000000-0000-0000-0000-000000000001",
      },
      roles: ["learner" as const],
    }));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    function TestLifecycleComponent() {
      const access = useAccountAccess();
      if (access.isPending) return <div>Checking access...</div>;
      if (access.data?.profile?.accountStatus === "pending_verification") {
        return <div>Email verification pending</div>;
      }
      if (access.data?.profile?.accountStatus === "active") {
        return <div>Welcome to Course Companion</div>;
      }
      return <div>Access denied</div>;
    }

    const { render, screen } = await import("@testing-library/react");
    render(
      <QueryClientProvider client={queryClient}>
        <TestLifecycleComponent />
      </QueryClientProvider>,
    );

    // Initial state after invite: pending_verification blocks learner
    expect(await screen.findByText("Email verification pending")).toBeInTheDocument();

    // User confirms email via link -> status becomes active on first login
    accountStatus = "active";
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    // Learner is now fully authorized
    expect(await screen.findByText("Welcome to Course Companion")).toBeInTheDocument();
  });
});
