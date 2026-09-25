import type { Enums } from "../../../lib/supabase/database.types";

export type ResourceScope = "learner" | "instructor";
export type ResourceType = Enums<"resource_type">;
export type ResourceLanguage = Enums<"resource_language">;

export type ResourceTopic = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

export type TeachingStage = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

export type GuideContent = {
  kind: "guide";
  sections: Array<{ heading: string; body: string }>;
};

export type ChecklistContent = {
  kind: "checklist";
  items: string[];
};

export type ResourceContent = GuideContent | ChecklistContent | null;

export type CourseResource = {
  id: string;
  versionId: string;
  slug: string;
  title: string;
  summary: string;
  type: ResourceType;
  contentLanguage: ResourceLanguage;
  estimatedMinutes: number | null;
  featured: boolean;
  versionNumber: number;
  guidelineSource: string | null;
  guidelineYear: number | null;
  reviewedAt: string | null;
  nextReviewAt: string | null;
  youtubeVideoId: string | null;
  content: ResourceContent;
  topics: ResourceTopic[];
  teachingStages: TeachingStage[];
  relatedResourceIds: string[];
};
