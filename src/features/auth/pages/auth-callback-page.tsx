import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { AuthLayout } from "../components/auth-layout";
import { useAuth } from "../context/auth-context";

type InviteStatus = "verifying" | "invalid_or_expired";

function cleanTokenFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const newPath = window.location.pathname;
    let newSearch = window.location.search;
    let newHash = window.location.hash;

    if (newSearch && newSearch.includes("token_hash")) {
      const cleanSearch = new URLSearchParams(newSearch);
      cleanSearch.delete("token_hash");
      cleanSearch.delete("type");
      const searchStr = cleanSearch.toString();
      newSearch = searchStr ? `?${searchStr}` : "";
    }

    if (newHash && newHash.includes("token_hash")) {
      const hashParts = newHash.split("?");
      newHash = hashParts[0];
    }

    window.history.replaceState(null, "", `${newPath}${newSearch}${newHash}`);
  } catch {
    // Ignore history replace failures in testing/isolated environments
  }
}

export function AuthCallbackPage() {
  const { state, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Support token_hash in HashRouter query or window.location.search
  const tokenHash =
    searchParams.get("token_hash") ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token_hash")
      : null);

  const rawType =
    searchParams.get("type") ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("type")
      : null);

  const isInviteCallback = Boolean(tokenHash && tokenHash.trim().length > 0);
  const isInvalidInviteType = isInviteCallback && rawType !== "invite";
  const [inviteStatus, setInviteStatus] = useState<InviteStatus | null>(() => {
    if (!isInviteCallback) return null;
    return isInvalidInviteType ? "invalid_or_expired" : "verifying";
  });
  const verificationAttemptedRef = useRef(false);

  // Branch 1: Invitation TokenHash verification
  useEffect(() => {
    if (!isInviteCallback || !tokenHash) return;
    if (verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;

    // Reject arbitrary types; explicitly require type === "invite"
    if (rawType !== "invite") {
      cleanTokenFromUrl();
      return;
    }

    let active = true;

    async function handleInvitationAcceptance() {
      try {
        const result = await verifyOtp({
          token_hash: tokenHash!,
          type: "invite",
        });

        if (!active) return;

        if (result.error || !result.session) {
          cleanTokenFromUrl();
          setInviteStatus("invalid_or_expired");
          return;
        }

        cleanTokenFromUrl();
        navigate("/auth/reset-password", { replace: true });
      } catch {
        if (!active) return;
        cleanTokenFromUrl();
        setInviteStatus("invalid_or_expired");
      }
    }

    void handleInvitationAcceptance();

    return () => {
      active = false;
    };
  }, [isInviteCallback, tokenHash, rawType, verifyOtp, navigate]);

  // Branch 2: Preserved PKCE recovery callback
  useEffect(() => {
    if (isInviteCallback) return;
    if (state.status === "signed_in") {
      navigate("/auth/reset-password", { replace: true });
    }
  }, [isInviteCallback, navigate, state.status]);

  if (isInviteCallback) {
    if (inviteStatus === "invalid_or_expired") {
      return (
        <AuthLayout>
          <div className="mx-auto max-w-md">
            <StatePanel
              actionLabel="Return to sign in"
              as="h1"
              description="This invitation link is invalid or has expired. Please contact your course administrator for a new invitation."
              kind="expired"
              onAction={() => navigate("/auth/login", { replace: true })}
              title="This invitation link is no longer available"
            />
          </div>
        </AuthLayout>
      );
    }

    return (
      <AuthLayout>
        <div className="mx-auto max-w-md">
          <StatePanel
            as="h1"
            description="Validating your course invitation and setting up your secure session."
            kind="loading"
            title="Accepting your invitation"
          />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-md">
        {state.status === "signed_out" ? (
          <StatePanel
            actionLabel="Return to sign in"
            as="h1"
            description="This link is invalid or has expired. Request a new password reset message."
            kind="expired"
            onAction={() => navigate("/auth/login", { replace: true })}
            title="This reset link is no longer available"
          />
        ) : (
          <StatePanel
            as="h1"
            description="Verifying the secure account link."
            kind="loading"
            title="Checking your link"
          />
        )}
      </div>
    </AuthLayout>
  );
}
