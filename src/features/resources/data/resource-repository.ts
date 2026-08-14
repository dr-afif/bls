import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../lib/supabase/database.types";
import type { CourseResource, ResourceContent } from "../model/resource-types";

const guideContentSchema = z.object({
  sections: z.array(z.object({ heading: z.string().min(1), body: z.string().min(1) })).min(1),
});
const checklistContentSchema = z.object({ items: z.array(z.string().min(1)).min(1) });

type CatalogRows = {
  resources: Array<{
    id: string;
    current_version_id: string | null;
    slug: string;
    title: string;
    resource_type: CourseResource["type"];
    estimated_minutes: number | null;
    featured: boolean;
  }>;
  versions: Array<{
    id: string;
    resource_id: string;
    version_number: number;
    resource_type: CourseResource["type"];
    title: string;
    summary: string;
    content: unknown;
    guideline_source: string | null;
    guideline_year: number | null;
    reviewed_at: string | null;
    next_review_at: string | null;
    youtube_video_id: string | null;
  }>;
  topicAssignments: Array<{ resource_id: string; topic_id: string; display_order: number }>;
  topics: Array<{ id: string; name: string; slug: string; display_order: number }>;
  stageAssignments: Array<{ resource_id: string; teaching_stage_id: string; display_order: number }>;
  stages: Array<{ id: string; name: string; slug: string; display_order: number }>;
  relations: Array<{ resource_id: string; related_resource_id: string; display_order: number }>;
};

function parseContent(type: CourseResource["type"], content: unknown): ResourceContent {
  if (type === "guide") {
    const parsed = guideContentSchema.safeParse(content);
    if (!parsed.success) throw new Error("RESOURCE_DATA_UNAVAILABLE");
    return { kind: "guide", sections: parsed.data.sections };
  }
  if (type === "checklist") {
    const parsed = checklistContentSchema.safeParse(content);
    if (!parsed.success) throw new Error("RESOURCE_DATA_UNAVAILABLE");
    return { kind: "checklist", items: parsed.data.items };
  }
  return null;
}

export function assembleResourceCatalog(rows: CatalogRows): CourseResource[] {
  const versionById = new Map(rows.versions.map((version) => [version.id, version]));
  const topicById = new Map(rows.topics.map((topic) => [topic.id, topic]));
  const stageById = new Map(rows.stages.map((stage) => [stage.id, stage]));

  return rows.resources.map((resource) => {
    const version = resource.current_version_id ? versionById.get(resource.current_version_id) : null;
    if (!version || version.resource_id !== resource.id || version.resource_type !== resource.resource_type) {
      throw new Error("RESOURCE_DATA_UNAVAILABLE");
    }

    const topics = rows.topicAssignments
      .filter((assignment) => assignment.resource_id === resource.id)
      .sort((left, right) => left.display_order - right.display_order)
      .flatMap((assignment) => {
        const topic = topicById.get(assignment.topic_id);
        return topic ? [{ ...topic, displayOrder: assignment.display_order }] : [];
      });
    const teachingStages = rows.stageAssignments
      .filter((assignment) => assignment.resource_id === resource.id)
      .sort((left, right) => left.display_order - right.display_order)
      .flatMap((assignment) => {
        const stage = stageById.get(assignment.teaching_stage_id);
        return stage ? [{ ...stage, displayOrder: assignment.display_order }] : [];
      });

    return {
      id: resource.id,
      versionId: version.id,
      slug: resource.slug,
      title: version.title,
      summary: version.summary,
      type: resource.resource_type,
      estimatedMinutes: resource.estimated_minutes,
      featured: resource.featured,
      versionNumber: version.version_number,
      guidelineSource: version.guideline_source,
      guidelineYear: version.guideline_year,
      reviewedAt: version.reviewed_at,
      nextReviewAt: version.next_review_at,
      youtubeVideoId: version.youtube_video_id,
      content: parseContent(resource.resource_type, version.content),
      topics,
      teachingStages,
      relatedResourceIds: rows.relations
        .filter((relation) => relation.resource_id === resource.id)
        .sort((left, right) => left.display_order - right.display_order)
        .map((relation) => relation.related_resource_id),
    };
  });
}

function assertResults(results: Array<{ error: unknown }>) {
  if (results.some(({ error }) => error)) throw new Error("RESOURCE_DATA_UNAVAILABLE");
}

export async function listCourseResources(client: SupabaseClient<Database>): Promise<CourseResource[]> {
  const [resources, versions, topicAssignments, topics, stageAssignments, stages, relations] = await Promise.all([
    client.from("resources").select("id, current_version_id, slug, title, resource_type, estimated_minutes, featured").eq("status", "published").order("featured", { ascending: false }).order("title"),
    client.from("resource_versions").select("id, resource_id, version_number, resource_type, title, summary, content, guideline_source, guideline_year, reviewed_at, next_review_at, youtube_video_id").eq("status", "approved"),
    client.from("resource_topics").select("resource_id, topic_id, display_order"),
    client.from("bls_topics").select("id, name, slug, display_order").eq("active", true).order("display_order"),
    client.from("resource_teaching_stages").select("resource_id, teaching_stage_id, display_order"),
    client.from("teaching_stages").select("id, name, slug, display_order").eq("active", true).order("display_order"),
    client.from("resource_relations").select("resource_id, related_resource_id, display_order"),
  ]);
  assertResults([resources, versions, topicAssignments, topics, stageAssignments, stages, relations]);

  return assembleResourceCatalog({
    resources: resources.data ?? [],
    versions: versions.data ?? [],
    topicAssignments: topicAssignments.data ?? [],
    topics: topics.data ?? [],
    stageAssignments: stageAssignments.data ?? [],
    stages: stages.data ?? [],
    relations: relations.data ?? [],
  });
}
