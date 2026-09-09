import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import * as authContext from "../../auth/context/auth-context";
import * as accountAccessHook from "../../auth/hooks/use-account-access";
import * as useOperationsHook from "../hooks/use-operations";
import { OperationsPeoplePage } from "./people-page";

type OperationsMutations = ReturnType<typeof useOperationsHook.useOperationsMutations>;
type AccountAccessResult = ReturnType<typeof accountAccessHook.useAccountAccess>;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe("OperationsPeoplePage", () => {
  const dummyPerson = {
    id: "person-1",
    fullName: "Jane Learner",
    staffId: "S-100",
    profession: "Nurse",
    department: "Emergency",
    accountStatus: "active" as const,
    roles: ["learner" as const],
    memberships: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    const mockClient = {} as unknown as SupabaseClient<Database>;
    const mockSession = { user: { id: "admin-1" } } as unknown as Session;
    const mockUser = { id: "admin-1" } as unknown as User;

    vi.spyOn(authContext, "useAuth").mockReturnValue({
      client: mockClient,
      state: {
        status: "signed_in",
        session: mockSession,
        user: mockUser,
      },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: vi.fn(),
    });

    vi.spyOn(useOperationsHook, "usePeople").mockReturnValue({
      data: [dummyPerson],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useOperationsHook.usePeople>);

    vi.spyOn(useOperationsHook, "useOperationsMutations").mockReturnValue({
      createCohort: {} as OperationsMutations["createCohort"],
      assignMember: {} as OperationsMutations["assignMember"],
      updateCohortStatus: {} as OperationsMutations["updateCohortStatus"],
      updateMembershipStatus: {} as OperationsMutations["updateMembershipStatus"],
      updateStatus: { mutateAsync: vi.fn(), isPending: false } as unknown as OperationsMutations["updateStatus"],
      inviteUser: { mutateAsync: vi.fn(), isPending: false } as unknown as OperationsMutations["inviteUser"],
    });
  });

  it("shows 'Invite user' button for administrators", () => {
    vi.spyOn(accountAccessHook, "useAccountAccess").mockReturnValue({
      data: {
        profile: {
          accountStatus: "active",
          fullName: "Admin User",
          organizationId: "10000000-0000-0000-0000-000000000001",
        },
        roles: ["admin"],
      },
      isPending: false,
      isError: false,
    } as unknown as AccountAccessResult);

    renderWithClient(<OperationsPeoplePage />);

    expect(screen.getByRole("button", { name: /Invite user/i })).toBeInTheDocument();
  });

  it("shows 'Invite user' button for super_administrators", () => {
    vi.spyOn(accountAccessHook, "useAccountAccess").mockReturnValue({
      data: {
        profile: {
          accountStatus: "active",
          fullName: "Super Admin",
          organizationId: "10000000-0000-0000-0000-000000000001",
        },
        roles: ["super_admin"],
      },
      isPending: false,
      isError: false,
    } as unknown as AccountAccessResult);

    renderWithClient(<OperationsPeoplePage />);

    expect(screen.getByRole("button", { name: /Invite user/i })).toBeInTheDocument();
  });

  it("hides 'Invite user' button for non-admin accounts (e.g. instructors or learners)", () => {
    vi.spyOn(accountAccessHook, "useAccountAccess").mockReturnValue({
      data: {
        profile: {
          accountStatus: "active",
          fullName: "Instructor User",
          organizationId: "10000000-0000-0000-0000-000000000001",
        },
        roles: ["instructor"],
      },
      isPending: false,
      isError: false,
    } as unknown as AccountAccessResult);

    renderWithClient(<OperationsPeoplePage />);

    expect(screen.queryByRole("button", { name: /Invite user/i })).not.toBeInTheDocument();
  });

  it("opens the InviteUserDialog when clicking 'Invite user'", async () => {
    const user = userEvent.setup();

    vi.spyOn(accountAccessHook, "useAccountAccess").mockReturnValue({
      data: {
        profile: {
          accountStatus: "active",
          fullName: "Admin User",
          organizationId: "10000000-0000-0000-0000-000000000001",
        },
        roles: ["admin"],
      },
      isPending: false,
      isError: false,
    } as unknown as AccountAccessResult);

    renderWithClient(<OperationsPeoplePage />);

    const inviteBtn = screen.getByRole("button", { name: /Invite user/i });
    await user.click(inviteBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Invite user" })).toBeInTheDocument();
  });
});
