import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import * as repository from "../data/resource-taxonomy-repository";

const rootQueryKey = ["resource-admin"] as const;
const taxonomyQueryKey = [...rootQueryKey, "taxonomy"] as const;

export function useAdminResourceTaxonomy() {
  const { client } = useAuth();
  return useQuery({
    enabled: Boolean(client),
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return repository.listResourceTaxonomy(client);
    },
    queryKey: taxonomyQueryKey,
  });
}

export function useAdminResourceTaxonomyMutations() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const requiredClient = () => {
    if (!client) throw new Error("AUTHENTICATION_REQUIRED");
    return client;
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey: rootQueryKey });
  return {
    create: useMutation({ mutationFn: (input: Parameters<typeof repository.createResourceTaxonomyItem>[1]) => repository.createResourceTaxonomyItem(requiredClient(), input), onSuccess: invalidate }),
    setActive: useMutation({ mutationFn: (input: Parameters<typeof repository.setResourceTaxonomyActive>[1]) => repository.setResourceTaxonomyActive(requiredClient(), input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Parameters<typeof repository.updateResourceTaxonomyItem>[1]) => repository.updateResourceTaxonomyItem(requiredClient(), input), onSuccess: invalidate }),
  };
}
