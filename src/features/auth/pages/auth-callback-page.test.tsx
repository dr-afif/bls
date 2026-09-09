import type { AuthError, Session, User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authContextModule from "../context/auth-context";
import { AuthCallbackPage } from "./auth-callback-page";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(initialEntry: string) {
  window.history.replaceState(null, "", initialEntry);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthCallbackPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuthCallbackPage", () => {
  const mockVerifyOtp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
    mockVerifyOtp.mockReset();

    vi.spyOn(authContextModule, "useAuth").mockReturnValue({
      client: null,
      state: { status: "signed_out" },
      requestPasswordReset: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      updatePassword: vi.fn(),
      verifyOtp: mockVerifyOtp,
    });
  });

  describe("TokenHash invitation acceptance branch", () => {
    it("successfully verifies valid invitation, cleans URL, and navigates to reset-password", async () => {
      const dummySession = {
        user: { id: "learner-1", email: "learner@example.com" },
      } as Session;

      mockVerifyOtp.mockResolvedValueOnce({
        error: null,
        session: dummySession,
      });

      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      renderWithRouter("/auth/callback?token_hash=test-token-hash-123&type=invite");

      // Verifying state appears
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Accepting your invitation");

      // Calls verifyOtp with explicit token_hash and type=invite exactly once
      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledTimes(1);
      });
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: "test-token-hash-123",
        type: "invite",
      });

      // Navigates to reset-password using history replace
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/auth/reset-password", { replace: true });
      });

      // Replaces history to remove token
      expect(replaceStateSpy).toHaveBeenCalled();
    });

    it("strips token_hash and type from window.location.hash upon completion", async () => {
      const dummySession = {
        user: { id: "learner-1", email: "learner@example.com" },
      } as Session;

      mockVerifyOtp.mockResolvedValueOnce({
        error: null,
        session: dummySession,
      });

      window.history.replaceState(null, "", "/bls/#/auth/callback?token_hash=hash-to-strip&type=invite");

      renderWithRouter("/auth/callback?token_hash=hash-to-strip&type=invite");

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/auth/reset-password", { replace: true });
      });

      expect(window.location.hash).not.toContain("hash-to-strip");
      expect(window.location.hash).not.toContain("token_hash");
    });

    it("strips token_hash and type from window.location.hash upon failure", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        error: { message: "Expired", name: "AuthApiError", status: 400 } as AuthError,
        session: null,
      });

      window.history.replaceState(null, "", "/bls/#/auth/callback?token_hash=failed-hash&type=invite");

      renderWithRouter("/auth/callback?token_hash=failed-hash&type=invite");

      await screen.findByRole("heading", { name: "This invitation link is no longer available" });

      expect(window.location.hash).not.toContain("failed-hash");
      expect(window.location.hash).not.toContain("token_hash");
    });

    it("fails closed on invalid or expired invitation token and shows safe error without navigating", async () => {
      mockVerifyOtp.mockResolvedValueOnce({
        error: { message: "Token has expired or is invalid", name: "AuthApiError", status: 400 } as AuthError,
        session: null,
      });

      const replaceStateSpy = vi.spyOn(window.history, "replaceState");

      renderWithRouter("/auth/callback?token_hash=expired-hash&type=invite");

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledTimes(1);
      });

      // Shows safe expired message
      expect(
        await screen.findByRole("heading", { name: "This invitation link is no longer available" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This invitation link is invalid or has expired\. Please contact your course administrator/),
      ).toBeInTheDocument();

      // Does NOT route to reset-password
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());

      // Cleans token from URL
      expect(replaceStateSpy).toHaveBeenCalled();

      // Can return to sign in
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Return to sign in" }));
      expect(mockNavigate).toHaveBeenCalledWith("/auth/login", { replace: true });
    });

    it("fails closed on verifyOtp network or unexpected exception", async () => {
      mockVerifyOtp.mockRejectedValueOnce(new Error("Network error"));

      renderWithRouter("/auth/callback?token_hash=error-hash&type=invite");

      expect(
        await screen.findByRole("heading", { name: "This invitation link is no longer available" }),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());
    });

    it("rejects unexpected type (e.g. magiclink) without calling verifyOtp and fails closed", async () => {
      renderWithRouter("/auth/callback?token_hash=test-token-hash&type=magiclink");

      expect(
        await screen.findByRole("heading", { name: "This invitation link is no longer available" }),
      ).toBeInTheDocument();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());
    });

    it("rejects unexpected type (e.g. recovery) without calling verifyOtp and fails closed", async () => {
      renderWithRouter("/auth/callback?token_hash=test-token-hash&type=recovery");

      expect(
        await screen.findByRole("heading", { name: "This invitation link is no longer available" }),
      ).toBeInTheDocument();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());
    });

    it("rejects missing type parameter without calling verifyOtp", async () => {
      renderWithRouter("/auth/callback?token_hash=test-token-hash");

      expect(
        await screen.findByRole("heading", { name: "This invitation link is no longer available" }),
      ).toBeInTheDocument();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());
    });
  });

  describe("Preserved PKCE password-recovery callback branch", () => {
    it("navigates to reset-password when user session is established via PKCE", async () => {
      vi.spyOn(authContextModule, "useAuth").mockReturnValue({
        client: null,
        state: {
          status: "signed_in",
          session: {} as Session,
          user: { id: "user-1" } as unknown as User,
        },
        requestPasswordReset: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        updatePassword: vi.fn(),
        verifyOtp: mockVerifyOtp,
      });

      renderWithRouter("/auth/callback");

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/auth/reset-password", { replace: true });
      });
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it("displays expired reset link panel when user is signed out and no invite token is present", async () => {
      vi.spyOn(authContextModule, "useAuth").mockReturnValue({
        client: null,
        state: { status: "signed_out" },
        requestPasswordReset: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        updatePassword: vi.fn(),
        verifyOtp: mockVerifyOtp,
      });

      renderWithRouter("/auth/callback");

      expect(
        await screen.findByRole("heading", { name: "This reset link is no longer available" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("This link is invalid or has expired. Request a new password reset message."),
      ).toBeInTheDocument();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("/auth/reset-password", expect.anything());

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Return to sign in" }));
      expect(mockNavigate).toHaveBeenCalledWith("/auth/login", { replace: true });
    });

    it("displays loading state while initializing recovery link", () => {
      vi.spyOn(authContextModule, "useAuth").mockReturnValue({
        client: null,
        state: { status: "initializing" },
        requestPasswordReset: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
        updatePassword: vi.fn(),
        verifyOtp: mockVerifyOtp,
      });

      renderWithRouter("/auth/callback");

      expect(screen.getByRole("heading", { name: "Checking your link" })).toBeInTheDocument();
      expect(screen.getByText("Verifying the secure account link.")).toBeInTheDocument();
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
