import type { Enums, Json } from "../../../lib/supabase/database.types";

export type ResourceStatus = Enums<"resource_status">;
export type ResourceType = Enums<"resource_type">;
export type ResourceAudience = Enums<"resource_audience">;
export type ResourceLanguage = Enums<"resource_language">;
export type ResourceOption = { id: string; name: string };
export type ResourceClassificationOption = ResourceOption & { active: boolean };

export type AdminResourceVersion = {
  approvedAt: string | null;
  content: Json | null;
  createdAt: string;
  guidelineSource: string | null;
  guidelineYear: number | null;
  id: string;
  nextReviewAt: string | null;
  reviewedAt: string | null;
  status: ResourceStatus;
  storagePath: string | null;
  summary: string;
  title: string;
  versionNumber: number;
  youtubeVideoId: string | null;
};

export type AdminAuditEvent = {
  action: string;
  actorName: string | null;
  actorUserId: string | null;
  createdAt: string;
  id: string;
};

export type AdminResource = {
  audiences: ResourceAudience[];
  auditEvents: AdminAuditEvent[];
  availableFrom: string | null;
  availableUntil: string | null;
  contentLanguage: ResourceLanguage;
  courseId: string;
  courseTitle: string | null;
  courseTitleMs: string | null;
  currentVersionId: string | null;
  estimatedMinutes: number | null;
  featured: boolean;
  id: string;
  organizationId: string;
  slug: string;
  stages: ResourceClassificationOption[];
  status: ResourceStatus;
  title: string;
  topics: ResourceClassificationOption[];
  type: ResourceType;
  updatedAt: string;
  versions: AdminResourceVersion[];
};

export type UpdateResourceMetadataInput = {
  actorUserId: string;
  contentLanguage: ResourceLanguage;
  estimatedMinutes: number | null;
  featured: boolean;
  resourceId: string;
  slug: string;
  title: string;
};

export type AdminResourceCatalog = {
  courses: Array<ResourceOption & { titleMs: string | null }>;
  resources: AdminResource[];
  stages: ResourceClassificationOption[];
  topics: ResourceClassificationOption[];
};

export type CreateResourceInput = {
  actorUserId: string;
  audiences: ResourceAudience[];
  contentLanguage: ResourceLanguage;
  courseId: string;
  estimatedMinutes: number | null;
  featured: boolean;
  guidelineSource: string | null;
  guidelineYear: number | null;
  organizationId: string;
  slug: string;
  stageIds: string[];
  summary: string;
  title: string;
  topicIds: string[];
  type: ResourceType;
  versionContent: Json | null;
  youtubeVideoId: string | null;
};
