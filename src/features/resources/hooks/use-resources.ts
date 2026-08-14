import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import { listCourseResources } from "../data/resource-repository";
import type { ResourceScope } from "../model/resource-types";

export const resourceCatalogKey = (scope: ResourceScope) => ["resources", "catalog", scope] as const;

export function useResourceCatalog(scope: ResourceScope) {
  const { client } = useAuth();
  return useQuery({
    enabled: Boolean(client),
    queryKey: resourceCatalogKey(scope),
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return listCourseResources(client);
    },
  });
}

export function useCourseResource(scope: ResourceScope, resourceId: string) {
  const query = useResourceCatalog(scope);
  return { ...query, resource: query.data?.find((resource) => resource.id === resourceId) };
}
