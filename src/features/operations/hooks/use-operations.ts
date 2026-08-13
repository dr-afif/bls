import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import {
  assignCohortMember,
  createCohort,
  listCohorts,
  listPeople,
  updateAccountStatus,
  updateCohortStatus,
  updateMembershipStatus,
} from "../data/people-cohorts-repository";

function useRequiredClient() {
  const { client, state } = useAuth();
  const userId = state.status === "signed_in" ? state.user.id : null;
  return { client, userId };
}

export function usePeople() {
  const { client } = useRequiredClient();
  return useQuery({
    enabled: Boolean(client),
    queryKey: ["operations", "people"],
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return listPeople(client);
    },
  });
}

export function useCohorts() {
  const { client } = useRequiredClient();
  return useQuery({
    enabled: Boolean(client),
    queryKey: ["operations", "cohorts"],
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return listCohorts(client);
    },
  });
}

export function useOperationsMutations() {
  const { client, userId } = useRequiredClient();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["operations"] });

  return {
    createCohort: useMutation({
      mutationFn: (input: Omit<Parameters<typeof createCohort>[1], "actorUserId">) => {
        if (!client || !userId) throw new Error("AUTHENTICATION_REQUIRED");
        return createCohort(client, { ...input, actorUserId: userId });
      },
      onSuccess: invalidate,
    }),
    assignMember: useMutation({
      mutationFn: (input: Omit<Parameters<typeof assignCohortMember>[1], "actorUserId">) => {
        if (!client || !userId) throw new Error("AUTHENTICATION_REQUIRED");
        return assignCohortMember(client, { ...input, actorUserId: userId });
      },
      onSuccess: invalidate,
    }),
    updateCohortStatus: useMutation({
      mutationFn: ({ cohortId, status }: { cohortId: string; status: Parameters<typeof updateCohortStatus>[2] }) => {
        if (!client) throw new Error("AUTHENTICATION_REQUIRED");
        return updateCohortStatus(client, cohortId, status);
      },
      onSuccess: invalidate,
    }),
    updateMembershipStatus: useMutation({
      mutationFn: (input: Parameters<typeof updateMembershipStatus>[1]) => {
        if (!client) throw new Error("AUTHENTICATION_REQUIRED");
        return updateMembershipStatus(client, input);
      },
      onSuccess: invalidate,
    }),
    updateStatus: useMutation({
      mutationFn: ({ accountStatus, targetUserId }: { accountStatus: Parameters<typeof updateAccountStatus>[2]; targetUserId: string }) => {
        if (!client) throw new Error("AUTHENTICATION_REQUIRED");
        return updateAccountStatus(client, targetUserId, accountStatus);
      },
      onSuccess: invalidate,
    }),
  };
}
