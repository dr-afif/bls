import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { AuthLayout } from "../components/auth-layout";
import { useAuth } from "../context/auth-context";

export function AuthCallbackPage() {
  const { state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.status === "signed_in") {
      navigate("/auth/reset-password", { replace: true });
    }
  }, [navigate, state.status]);

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
