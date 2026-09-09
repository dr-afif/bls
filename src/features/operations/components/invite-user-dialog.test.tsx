import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as useOperationsHook from "../hooks/use-operations";
import { InviteUserDialog } from "./invite-user-dialog";

type OperationsMutations = ReturnType<typeof useOperationsHook.useOperationsMutations>;

function mockMutations(inviteUserOverride: Partial<OperationsMutations["inviteUser"]>): OperationsMutations {
  return {
    createCohort: {} as OperationsMutations["createCohort"],
    assignMember: {} as OperationsMutations["assignMember"],
    updateCohortStatus: {} as OperationsMutations["updateCohortStatus"],
    updateMembershipStatus: {} as OperationsMutations["updateMembershipStatus"],
    updateStatus: {} as OperationsMutations["updateStatus"],
    inviteUser: inviteUserOverride as OperationsMutations["inviteUser"],
  };
}

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

describe("InviteUserDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(useOperationsHook, "useOperationsMutations").mockReturnValue(
      mockMutations({
        mutateAsync: vi.fn().mockResolvedValue({
          id: "new-user-1",
          email: "user@example.com",
          fullName: "Test User",
          role: "learner",
          organizationId: "10000000-0000-0000-0000-000000000001",
        }) as unknown as OperationsMutations["inviteUser"]["mutateAsync"],
        isPending: false,
      }),
    );
  });

  it("renders nothing when isOpen is false", () => {
    renderWithClient(
      <InviteUserDialog
        isOpen={false}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders form controls with accessible dialog attributes when isOpen is true", () => {
    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
        organizationId="10000000-0000-0000-0000-000000000001"
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Invite user" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Learner" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Unlimited" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeInTheDocument();
  });

  it("toggles limited-access window fields when selected", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/Access expiry/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Limited window" }));

    expect(screen.getByLabelText(/Access start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Access expiry/i)).toBeInTheDocument();
  });

  it("validates missing expiry date in limited mode", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Email address/i), "learner@test.com");
    await user.type(screen.getByLabelText(/Full name/i), "Test Learner");
    await user.click(screen.getByRole("radio", { name: "Limited window" }));

    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(await screen.findByText("Please select an expiry date for limited access.")).toBeInTheDocument();
  });

  it("validates that expiry date must be in the future", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Email address/i), "learner@test.com");
    await user.type(screen.getByLabelText(/Full name/i), "Test Learner");
    await user.click(screen.getByRole("radio", { name: "Limited window" }));

    const expiryInput = screen.getByLabelText(/Access expiry/i);
    fireEvent.change(expiryInput, { target: { value: "2020-01-01T00:00" } });

    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(await screen.findByText("Expiry date must be in the future.")).toBeInTheDocument();
  });

  it("displays mapped error message for duplicate user", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error("USER_ALREADY_EXISTS"));

    vi.spyOn(useOperationsHook, "useOperationsMutations").mockReturnValue(
      mockMutations({
        mutateAsync: mutateAsync as unknown as OperationsMutations["inviteUser"]["mutateAsync"],
        isPending: false,
      }),
    );

    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/Email address/i), "duplicate@test.com");
    await user.type(screen.getByLabelText(/Full name/i), "Duplicate User");
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(
      await screen.findByText("A user with this email address has already been registered."),
    ).toBeInTheDocument();
  });

  it("submits valid form data and notifies success callback", async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({
      id: "new-user-id",
      email: "newlearner@test.com",
      fullName: "Jane Doe",
      role: "instructor",
      organizationId: "10000000-0000-0000-0000-000000000001",
    });
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    vi.spyOn(useOperationsHook, "useOperationsMutations").mockReturnValue(
      mockMutations({
        mutateAsync: mutateAsync as unknown as OperationsMutations["inviteUser"]["mutateAsync"],
        isPending: false,
      }),
    );

    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        organizationId="10000000-0000-0000-0000-000000000001"
      />,
    );

    await user.type(screen.getByLabelText(/Email address/i), "newlearner@test.com");
    await user.type(screen.getByLabelText(/Full name/i), "Jane Doe");
    await user.click(screen.getByRole("radio", { name: "Instructor" }));
    await user.click(screen.getByRole("button", { name: "Send invitation" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        email: "newlearner@test.com",
        fullName: "Jane Doe",
        role: "instructor",
        accessMode: "unlimited",
        startsAt: null,
        expiresAt: null,
        organizationId: "10000000-0000-0000-0000-000000000001",
      });
    });

    expect(onSuccess).toHaveBeenCalledWith({
      email: "newlearner@test.com",
      fullName: "Jane Doe",
      role: "instructor",
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("disables buttons and indicates pending state during submission", () => {
    vi.spyOn(useOperationsHook, "useOperationsMutations").mockReturnValue(
      mockMutations({
        mutateAsync: vi.fn() as unknown as OperationsMutations["inviteUser"]["mutateAsync"],
        isPending: true,
      }),
    );

    renderWithClient(
      <InviteUserDialog
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /Sending invitation\.\.\./i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
