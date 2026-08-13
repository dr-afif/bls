import { Navigate } from "react-router-dom";

import { useAccountAccess } from "../hooks/use-account-access";

export function RoleRedirect() {
  const { data } = useAccountAccess();
  const roles = data?.roles ?? [];

  if (roles.includes("super_admin") || roles.includes("admin")) {
    return <Navigate replace to="/app/admin" />;
  }
  if (roles.includes("instructor")) return <Navigate replace to="/app/instructor" />;
  return <Navigate replace to="/app/learner" />;
}
