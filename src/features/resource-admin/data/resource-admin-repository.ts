import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../../../lib/supabase/database.types";
import type {
  AdminResource,
  AdminResourceCatalog,
  CreateResourceInput,
  ResourceAudience,
  UpdateResourceMetadataInput,
} from "../model/resource-admin-types";

type Client = SupabaseClient<Database>;

function fail(code: string): never {
  throw new Error(code);
}

function ensureResults(results: Array<{ error: unknown }>) {
  if (results.some(({ error }) => error)) fail("RESOURCE_ADMIN_DATA_UNAVAILABLE");
}

export async function listAdminResourceCatalog(client: Client): Promise<AdminResourceCatalog> {
  const [resources, versions, audiences, topicAssignments, topics, stageAssignments, stages, courses, auditEvents, profiles] = await Promise.all([
    client.from("resources").select("id, organization_id, course_id, slug, title, resource_type, status, current_version_id, estimated_minutes, featured, available_from, available_until, updated_at").order("updated_at", { ascending: false }).limit(100),
    client.from("resource_versions").select("id, resource_id, version_number, title, summary, content, youtube_video_id, storage_path, guideline_source, guideline_year, reviewed_at, next_review_at, approved_at, status, created_at").order("created_at", { ascending: false }).limit(500),
    client.from("resource_audiences").select("resource_id, audience"),
    client.from("resource_topics").select("resource_id, topic_id, display_order"),
    client.from("bls_topics").select("id, name, display_order").eq("active", true).order("display_order"),
    client.from("resource_teaching_stages").select("resource_id, teaching_stage_id, display_order"),
    client.from("teaching_stages").select("id, name, display_order").eq("active", true).order("display_order"),
    client.from("courses").select("id, title, status").neq("status", "archived").order("title"),
    client.from("audit_events").select("id, actor_user_id, action, entity_id, created_at").in("entity_type", ["resource", "resource_version"]).order("created_at", { ascending: false }).limit(100),
    client.from("profiles").select("id, full_name"),
  ]);
  ensureResults([resources, versions, audiences, topicAssignments, topics, stageAssignments, stages, courses, auditEvents, profiles]);

  const topicById = new Map((topics.data ?? []).map((topic) => [topic.id, topic]));
  const stageById = new Map((stages.data ?? []).map((stage) => [stage.id, stage]));
  const courseById = new Map((courses.data ?? []).map((course) => [course.id, course]));
  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.full_name]));

  const assembled: AdminResource[] = (resources.data ?? []).map((resource) => {
    const resourceVersions = (versions.data ?? []).filter((version) => version.resource_id === resource.id);
    const entityIds = new Set([resource.id, ...resourceVersions.map((version) => version.id)]);
    return {
    audiences: (audiences.data ?? []).filter((item) => item.resource_id === resource.id).map((item) => item.audience),
    auditEvents: (auditEvents.data ?? []).filter((event) => event.entity_id && entityIds.has(event.entity_id)).slice(0, 8).map((event) => ({
      action: event.action,
      actorName: event.actor_user_id ? profileById.get(event.actor_user_id) ?? "Authorized system actor" : "System",
      createdAt: event.created_at,
      id: event.id,
    })),
    availableFrom: resource.available_from,
    availableUntil: resource.available_until,
    courseId: resource.course_id,
    courseTitle: courseById.get(resource.course_id)?.title ?? "Course unavailable",
    currentVersionId: resource.current_version_id,
    estimatedMinutes: resource.estimated_minutes,
    featured: resource.featured,
    id: resource.id,
    organizationId: resource.organization_id,
    slug: resource.slug,
    status: resource.status,
    title: resource.title,
    topics: (topicAssignments.data ?? [])
      .filter((item) => item.resource_id === resource.id)
      .sort((left, right) => left.display_order - right.display_order)
      .flatMap((item) => {
        const topic = topicById.get(item.topic_id);
        return topic ? [{ id: topic.id, name: topic.name }] : [];
      }),
    stages: (stageAssignments.data ?? [])
      .filter((item) => item.resource_id === resource.id)
      .sort((left, right) => left.display_order - right.display_order)
      .flatMap((item) => {
        const stage = stageById.get(item.teaching_stage_id);
        return stage ? [{ id: stage.id, name: stage.name }] : [];
      }),
    type: resource.resource_type,
    updatedAt: resource.updated_at,
    versions: resourceVersions.map((version) => ({
        approvedAt: version.approved_at,
        content: version.content,
        createdAt: version.created_at,
        guidelineSource: version.guideline_source,
        guidelineYear: version.guideline_year,
        id: version.id,
        nextReviewAt: version.next_review_at,
        reviewedAt: version.reviewed_at,
        status: version.status,
        storagePath: version.storage_path,
        summary: version.summary,
        title: version.title,
        versionNumber: version.version_number,
        youtubeVideoId: version.youtube_video_id,
      })),
  };});

  return {
    courses: (courses.data ?? []).map((course) => ({ id: course.id, name: course.title })),
    resources: assembled,
    stages: (stages.data ?? []).map((stage) => ({ id: stage.id, name: stage.name })),
    topics: (topics.data ?? []).map((topic) => ({ id: topic.id, name: topic.name })),
  };
}

export async function updateResourceMetadata(client: Client, input: UpdateResourceMetadataInput) {
  const { error } = await client.from("resources").update({
    estimated_minutes: input.estimatedMinutes,
    featured: input.featured,
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    updated_by: input.actorUserId,
  }).eq("id", input.resourceId);
  if (error) fail("RESOURCE_METADATA_UPDATE_FAILED");
}

export async function createResource(client: Client, input: CreateResourceInput) {
  const { data: resource, error: resourceError } = await client.from("resources").insert({
    organization_id: input.organizationId,
    course_id: input.courseId,
    slug: input.slug.trim().toLowerCase(),
    title: input.title.trim(),
    resource_type: input.type,
    estimated_minutes: input.estimatedMinutes,
    featured: input.featured,
    created_by: input.actorUserId,
    updated_by: input.actorUserId,
  }).select("id").single();
  if (resourceError || !resource) fail("RESOURCE_CREATE_FAILED");

  const { data: version, error: versionError } = await client.rpc("create_resource_version_draft", {
    target_resource_id: resource.id,
    draft_title: input.title.trim(),
    draft_summary: input.summary.trim(),
    draft_content: input.versionContent,
    draft_youtube_video_id: input.youtubeVideoId ?? undefined,
    draft_guideline_source: input.guidelineSource ?? undefined,
    draft_guideline_year: input.guidelineYear ?? undefined,
  });
  if (versionError || !version?.[0]) fail("RESOURCE_VERSION_CREATE_FAILED");

  const { error: classificationsError } = await client.rpc("replace_resource_classifications", {
    target_resource_id: resource.id,
    target_audiences: input.audiences,
    target_topic_ids: input.topicIds,
    target_teaching_stage_ids: input.stageIds,
  });
  if (classificationsError) fail("RESOURCE_CLASSIFICATIONS_FAILED");
  return { resourceId: resource.id, versionId: version[0].version_id };
}

export async function createResourceVersion(client: Client, input: {
  resourceId: string;
  title: string;
  summary: string;
  content: Json | null;
  youtubeVideoId: string | null;
  guidelineSource: string | null;
  guidelineYear: number | null;
}) {
  const { data, error } = await client.rpc("create_resource_version_draft", {
    target_resource_id: input.resourceId,
    draft_title: input.title.trim(),
    draft_summary: input.summary.trim(),
    draft_content: input.content,
    draft_youtube_video_id: input.youtubeVideoId ?? undefined,
    draft_guideline_source: input.guidelineSource ?? undefined,
    draft_guideline_year: input.guidelineYear ?? undefined,
  });
  if (error || !data?.[0]) fail("RESOURCE_VERSION_CREATE_FAILED");
  return data[0];
}

export async function updateResourceVersionDraft(client: Client, versionId: string, values: {
  content: Json | null;
  guidelineSource: string | null;
  guidelineYear: number | null;
  summary: string;
  title: string;
  youtubeVideoId: string | null;
}) {
  const { error } = await client.from("resource_versions").update({
    content: values.content,
    guideline_source: values.guidelineSource,
    guideline_year: values.guidelineYear,
    summary: values.summary.trim(),
    title: values.title.trim(),
    youtube_video_id: values.youtubeVideoId,
  }).eq("id", versionId).eq("status", "draft");
  if (error) fail("RESOURCE_VERSION_UPDATE_FAILED");
}

export async function replaceClassifications(client: Client, input: {
  audiences: ResourceAudience[];
  resourceId: string;
  stageIds: string[];
  topicIds: string[];
}) {
  const { error } = await client.rpc("replace_resource_classifications", {
    target_resource_id: input.resourceId,
    target_audiences: input.audiences,
    target_topic_ids: input.topicIds,
    target_teaching_stage_ids: input.stageIds,
  });
  if (error) fail("RESOURCE_CLASSIFICATIONS_FAILED");
}

export async function uploadDraftPdf(client: Client, path: string, file: File) {
  if (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024) fail("RESOURCE_PDF_INVALID");
  const { error } = await client.storage.from("course-resources").upload(path, file, {
    cacheControl: "0",
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) fail("RESOURCE_PDF_UPLOAD_FAILED");
}

export async function getDraftPdfStatus(client: Client, versionId: string) {
  const { data, error } = await client.rpc("get_resource_pdf_file_status", { target_version_id: versionId });
  if (error || !data?.[0]) fail("RESOURCE_PDF_STATUS_FAILED");
  return data[0];
}

async function callVersionRpc(client: Client, name: "approve_resource_version" | "submit_resource_version_for_review", versionId: string) {
  const { error } = await client.rpc(name, { target_version_id: versionId });
  if (error) fail(name === "approve_resource_version" ? "RESOURCE_APPROVAL_FAILED" : "RESOURCE_REVIEW_SUBMISSION_FAILED");
}

export const submitVersionForReview = (client: Client, versionId: string) => callVersionRpc(client, "submit_resource_version_for_review", versionId);
export const approveVersion = (client: Client, versionId: string) => callVersionRpc(client, "approve_resource_version", versionId);

export async function recordVersionReview(client: Client, versionId: string, nextReviewAt: string) {
  const { error } = await client.rpc("record_resource_version_review", { target_version_id: versionId, target_next_review_at: nextReviewAt });
  if (error) fail("RESOURCE_REVIEW_FAILED");
}

export async function publishVersion(client: Client, resourceId: string, versionId: string) {
  const { error } = await client.rpc("publish_resource_version", { target_resource_id: resourceId, target_version_id: versionId });
  if (error) fail("RESOURCE_PUBLICATION_FAILED");
}

export async function retireResource(client: Client, resourceId: string) {
  const { error } = await client.rpc("retire_resource", { target_resource_id: resourceId });
  if (error) fail("RESOURCE_RETIREMENT_FAILED");
}

export async function discardDraft(client: Client, versionId: string, storagePath: string | null) {
  if (storagePath) {
    const status = await getDraftPdfStatus(client, versionId);
    if (status.file_state === "ready") {
      const { error } = await client.storage.from("course-resources").remove([storagePath]);
      if (error) fail("RESOURCE_PDF_REMOVE_FAILED");
    }
  }
  const { error } = await client.rpc("discard_resource_version_draft", { target_version_id: versionId });
  if (error) fail("RESOURCE_DRAFT_DISCARD_FAILED");
}
