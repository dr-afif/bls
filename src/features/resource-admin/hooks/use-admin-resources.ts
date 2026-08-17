import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import * as repository from "../data/resource-admin-repository";

const queryKey = ["resource-admin"] as const;

function useClient() {
  const { client, state } = useAuth();
  return { client, userId: state.status === "signed_in" ? state.user.id : null };
}

export function useAdminResourceCatalog() {
  const { client } = useClient();
  return useQuery({
    enabled: Boolean(client),
    queryKey,
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return repository.listAdminResourceCatalog(client);
    },
  });
}

export function useDraftPdfStatus(versionId: string, enabled: boolean) {
  const { client } = useClient();
  return useQuery({
    enabled: Boolean(client) && enabled,
    queryKey: [...queryKey, "pdf-status", versionId],
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return repository.getDraftPdfStatus(client, versionId);
    },
  });
}

export function useAdminResourceMutations() {
  const { client, userId } = useClient();
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const requiredClient = () => {
    if (!client) throw new Error("AUTHENTICATION_REQUIRED");
    return client;
  };

  return {
    approve: useMutation({ mutationFn: (versionId: string) => repository.approveVersion(requiredClient(), versionId), onSuccess: invalidate }),
    create: useMutation({
      mutationFn: (input: Omit<Parameters<typeof repository.createResource>[1], "actorUserId">) => {
        if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
        return repository.createResource(requiredClient(), { ...input, actorUserId: userId });
      },
      onSuccess: invalidate,
    }),
    createVersion: useMutation({ mutationFn: (input: Parameters<typeof repository.createResourceVersion>[1]) => repository.createResourceVersion(requiredClient(), input), onSuccess: invalidate }),
    discard: useMutation({ mutationFn: ({ storagePath, versionId }: { storagePath: string | null; versionId: string }) => repository.discardDraft(requiredClient(), versionId, storagePath), onSuccess: invalidate }),
    publish: useMutation({ mutationFn: ({ resourceId, versionId }: { resourceId: string; versionId: string }) => repository.publishVersion(requiredClient(), resourceId, versionId), onSuccess: invalidate }),
    recordReview: useMutation({ mutationFn: ({ nextReviewAt, versionId }: { nextReviewAt: string; versionId: string }) => repository.recordVersionReview(requiredClient(), versionId, nextReviewAt), onSuccess: invalidate }),
    replaceClassifications: useMutation({ mutationFn: (input: Parameters<typeof repository.replaceClassifications>[1]) => repository.replaceClassifications(requiredClient(), input), onSuccess: invalidate }),
    retire: useMutation({ mutationFn: (resourceId: string) => repository.retireResource(requiredClient(), resourceId), onSuccess: invalidate }),
    submitForReview: useMutation({ mutationFn: (versionId: string) => repository.submitVersionForReview(requiredClient(), versionId), onSuccess: invalidate }),
    updateMetadata: useMutation({
      mutationFn: (input: Omit<Parameters<typeof repository.updateResourceMetadata>[1], "actorUserId">) => {
        if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
        return repository.updateResourceMetadata(requiredClient(), { ...input, actorUserId: userId });
      },
      onSuccess: invalidate,
    }),
    updateDraft: useMutation({ mutationFn: ({ values, versionId }: { values: Parameters<typeof repository.updateResourceVersionDraft>[2]; versionId: string }) => repository.updateResourceVersionDraft(requiredClient(), versionId, values), onSuccess: invalidate }),
    uploadPdf: useMutation({ mutationFn: ({ file, path }: { file: File; path: string }) => repository.uploadDraftPdf(requiredClient(), path, file), onSuccess: invalidate }),
  };
}
