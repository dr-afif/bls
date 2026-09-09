import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../context/auth-context";
import { getAccountAccess } from "../data/account-access-repository";

export function useAccountAccess() {
  const { client, state } = useAuth();
  const userId = state.status === "signed_in" ? state.user.id : null;

  return useQuery({
    enabled: Boolean(client && userId),
    queryFn: () => {
      if (!client || !userId) throw new Error("AUTHENTICATION_REQUIRED");
      return getAccountAccess(client, userId);
    },
    queryKey: ["account-access", userId],
    refetchOnWindowFocus: "always",
  });
}
