import { Navigate, Outlet, useLocation } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { AuthLayout } from "../components/auth-layout";
import { useAuth } from "../context/auth-context";
import { useAccountAccess } from "../hooks/use-account-access";
import type { AppRole } from "../model/auth-types";
import { AccessStatePage } from "../pages/access-state-page";

export function RequireAuthentication() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === "configuration_error") return <AccessStatePage variant="configuration" />;
  if (state.status === "initializing") {
    return <AuthLayout><div className="mx-auto max-w-lg"><StatePanel as="h1" kind="loading" title="Restoring your session" description="Checking your existing sign-in securely." /></div></AuthLayout>;
  }
  if (state.status === "signed_out") {
    return <Navigate replace state={{ from: location.pathname }} to="/auth/login" />;
  }
  return <Outlet />;
}

export function RequireAccountAccess({ allowedRoles }: { allowedRoles?: AppRole[] }) {
  const access = useAccountAccess();

  if (access.isPending) {
    return <AuthLayout><div className="mx-auto max-w-lg"><StatePanel as="h1" kind="loading" title="Checking account access" description="Loading your profile, account status, and assigned role." /></div></AuthLayout>;
  }
  if (access.isError) {
    return <AuthLayout><div className="mx-auto max-w-lg"><StatePanel actionLabel="Try again" as="h1" kind="error" onAction={() => void access.refetch()} title="We could not check your access" description="No account data was changed. Check your connection and try again." /></div></AuthLayout>;
  }
  if (!access.data?.profile) return <AccessStatePage variant="missing-profile" />;
  if (access.data.profile.accountStatus !== "active") return <AccessStatePage status={access.data.profile.accountStatus} />;
  if (access.data.roles.length === 0) return <AccessStatePage variant="missing-role" />;
  if (allowedRoles && !access.data.roles.some((role) => allowedRoles.includes(role))) {
    return <AccessStatePage variant="role" />;
  }
  return <Outlet />;
}
