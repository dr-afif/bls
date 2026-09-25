import type { CourseResource, ResourceLanguage, ResourceType } from "./resource-types";

export const typeOptions: readonly (ResourceType | "all")[] = [
  "all",
  "guide",
  "checklist",
  "pdf",
  "youtube_video",
] as const;

export const languageOptions: readonly (ResourceLanguage | "all")[] = [
  "all",
  "en",
  "ms",
  "bilingual",
  "language_independent",
] as const;

export function normalizeTypeParam(raw: string | null): ResourceType | "all" {
  if (!raw || raw === "all" || raw === "All types") return "all";
  if (raw === "guide" || raw === "Guide") return "guide";
  if (raw === "checklist" || raw === "Checklist") return "checklist";
  if (raw === "pdf" || raw === "Document") return "pdf";
  if (raw === "youtube_video" || raw === "Video") return "youtube_video";
  return "all";
}

export function normalizeLanguageParam(raw: string | null): ResourceLanguage | "all" {
  if (!raw) return "all";
  if (
    raw === "all" ||
    raw === "en" ||
    raw === "ms" ||
    raw === "bilingual" ||
    raw === "language_independent"
  ) {
    return raw;
  }
  return "all";
}

export function matchesResourceLanguage(
  resourceLanguage: ResourceLanguage,
  selectedLanguage: ResourceLanguage | "all",
): boolean {
  if (selectedLanguage === "all") {
    return true;
  }
  if (selectedLanguage === "en") {
    return resourceLanguage === "en" || resourceLanguage === "bilingual";
  }
  if (selectedLanguage === "ms") {
    return resourceLanguage === "ms" || resourceLanguage === "bilingual";
  }
  if (selectedLanguage === "bilingual") {
    return resourceLanguage === "bilingual";
  }
  if (selectedLanguage === "language_independent") {
    return resourceLanguage === "language_independent";
  }
  return false;
}

export function filterResources(
  resources: CourseResource[],
  query: string,
  topic: string,
  stage: string,
  type: ResourceType | "all",
  language: ResourceLanguage | "all",
): CourseResource[] {
  const normalizedQuery = query.trim().toLowerCase();
  return resources.filter((resource) => {
    const searchable = [
      resource.title,
      resource.summary,
      ...resource.topics.map(({ name }) => name),
      ...resource.teachingStages.map(({ name }) => name),
    ].join(" ").toLowerCase();

    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (topic === "all" || resource.topics.some(({ slug }) => slug === topic))
      && (stage === "all" || resource.teachingStages.some(({ slug }) => slug === stage))
      && (type === "all" || resource.type === type)
      && matchesResourceLanguage(resource.contentLanguage, language);
  });
}
