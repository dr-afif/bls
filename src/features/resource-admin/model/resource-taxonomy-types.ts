export type ResourceTaxonomyKind = "topic" | "stage";

export type ResourceTaxonomyItem = {
  active: boolean;
  blockingPublishedResourceCount: number;
  description: string | null;
  displayOrder: number;
  id: string;
  kind: ResourceTaxonomyKind;
  name: string;
  publishedUsageCount: number;
  slug: string;
  usageCount: number;
};

export type ResourceTaxonomyAuditEvent = {
  action: string;
  actorName: string;
  createdAt: string;
  id: string;
  itemName: string;
};

export type ResourceTaxonomyCatalog = {
  auditEvents: ResourceTaxonomyAuditEvent[];
  stages: ResourceTaxonomyItem[];
  topics: ResourceTaxonomyItem[];
};

export type ResourceTaxonomyWriteInput = {
  description: string | null;
  displayOrder: number;
  kind: ResourceTaxonomyKind;
  name: string;
};

export type CreateResourceTaxonomyInput = ResourceTaxonomyWriteInput & {
  organizationId: string;
  slug: string;
};

export type UpdateResourceTaxonomyInput = ResourceTaxonomyWriteInput & {
  id: string;
};
