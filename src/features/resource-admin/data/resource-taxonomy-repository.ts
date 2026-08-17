import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "../../../lib/supabase/database.types";
import type {
  CreateResourceTaxonomyInput,
  ResourceTaxonomyAuditEvent,
  ResourceTaxonomyCatalog,
  ResourceTaxonomyItem,
  UpdateResourceTaxonomyInput,
} from "../model/resource-taxonomy-types";

type Client = SupabaseClient<Database>;
type TopicRow = Database["public"]["Tables"]["bls_topics"]["Row"];
type StageRow = Database["public"]["Tables"]["teaching_stages"]["Row"];
type ResourceRow = Pick<Database["public"]["Tables"]["resources"]["Row"], "id" | "status">;
type TopicAssignment = Pick<Database["public"]["Tables"]["resource_topics"]["Row"], "resource_id" | "topic_id">;
type StageAssignment = Pick<Database["public"]["Tables"]["resource_teaching_stages"]["Row"], "resource_id" | "teaching_stage_id">;
type AudienceAssignment = Pick<Database["public"]["Tables"]["resource_audiences"]["Row"], "resource_id" | "audience">;
type AuditRow = Pick<Database["public"]["Tables"]["audit_events"]["Row"], "action" | "actor_user_id" | "created_at" | "entity_id" | "id" | "metadata">;
type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "id">;

export type ResourceTaxonomyRows = {
  audiences: AudienceAssignment[];
  auditEvents: AuditRow[];
  profiles: ProfileRow[];
  resources: ResourceRow[];
  stageAssignments: StageAssignment[];
  stages: StageRow[];
  topicAssignments: TopicAssignment[];
  topics: TopicRow[];
};

function metadataName(metadata: Json) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") return "Taxonomy item";
  const name = metadata.name;
  return typeof name === "string" && name.trim() ? name : "Taxonomy item";
}

function compareItems(left: ResourceTaxonomyItem, right: ResourceTaxonomyItem) {
  return left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
}

export function assembleResourceTaxonomyCatalog(rows: ResourceTaxonomyRows): ResourceTaxonomyCatalog {
  const resourceStatus = new Map(rows.resources.map((resource) => [resource.id, resource.status]));
  const publishedIds = new Set(rows.resources.filter((resource) => resource.status === "published").map((resource) => resource.id));
  const instructorIds = new Set(rows.audiences.filter((item) => item.audience === "instructor").map((item) => item.resource_id));
  const activeTopicIds = new Set(rows.topics.filter((item) => item.active).map((item) => item.id));
  const activeStageIds = new Set(rows.stages.filter((item) => item.active).map((item) => item.id));
  const topicIdsByResource = new Map<string, string[]>();
  const stageIdsByResource = new Map<string, string[]>();
  for (const assignment of rows.topicAssignments) topicIdsByResource.set(assignment.resource_id, [...(topicIdsByResource.get(assignment.resource_id) ?? []), assignment.topic_id]);
  for (const assignment of rows.stageAssignments) stageIdsByResource.set(assignment.resource_id, [...(stageIdsByResource.get(assignment.resource_id) ?? []), assignment.teaching_stage_id]);

  const topics = rows.topics.map<ResourceTaxonomyItem>((item) => {
    const assignedResourceIds = rows.topicAssignments.filter((assignment) => assignment.topic_id === item.id).map((assignment) => assignment.resource_id);
    return {
      active: item.active,
      blockingPublishedResourceCount: assignedResourceIds.filter((resourceId) => publishedIds.has(resourceId) && (topicIdsByResource.get(resourceId) ?? []).filter((id) => id !== item.id && activeTopicIds.has(id)).length === 0).length,
      description: item.description,
      displayOrder: item.display_order,
      id: item.id,
      kind: "topic",
      name: item.name,
      publishedUsageCount: assignedResourceIds.filter((resourceId) => resourceStatus.get(resourceId) === "published").length,
      slug: item.slug,
      usageCount: new Set(assignedResourceIds).size,
    };
  }).sort(compareItems);

  const stages = rows.stages.map<ResourceTaxonomyItem>((item) => {
    const assignedResourceIds = rows.stageAssignments.filter((assignment) => assignment.teaching_stage_id === item.id).map((assignment) => assignment.resource_id);
    return {
      active: item.active,
      blockingPublishedResourceCount: assignedResourceIds.filter((resourceId) => publishedIds.has(resourceId) && instructorIds.has(resourceId) && (stageIdsByResource.get(resourceId) ?? []).filter((id) => id !== item.id && activeStageIds.has(id)).length === 0).length,
      description: item.description,
      displayOrder: item.display_order,
      id: item.id,
      kind: "stage",
      name: item.name,
      publishedUsageCount: assignedResourceIds.filter((resourceId) => resourceStatus.get(resourceId) === "published").length,
      slug: item.slug,
      usageCount: new Set(assignedResourceIds).size,
    };
  }).sort(compareItems);

  const profileById = new Map(rows.profiles.map((profile) => [profile.id, profile.full_name]));
  const auditEvents = rows.auditEvents.map<ResourceTaxonomyAuditEvent>((event) => ({
    action: event.action,
    actorName: event.actor_user_id ? profileById.get(event.actor_user_id) ?? "Authorized administrator" : "System",
    createdAt: event.created_at,
    id: event.id,
    itemName: metadataName(event.metadata),
  }));

  return { auditEvents, stages, topics };
}

function ensureResults(results: Array<{ error: unknown }>) {
  if (results.some(({ error }) => error)) throw new Error("RESOURCE_TAXONOMY_DATA_UNAVAILABLE");
}

export async function listResourceTaxonomy(client: Client): Promise<ResourceTaxonomyCatalog> {
  const [topics, stages, resources, topicAssignments, stageAssignments, audiences, auditEvents, profiles] = await Promise.all([
    client.from("bls_topics").select("*").order("display_order").order("name"),
    client.from("teaching_stages").select("*").order("display_order").order("name"),
    client.from("resources").select("id, status").limit(500),
    client.from("resource_topics").select("resource_id, topic_id").limit(5000),
    client.from("resource_teaching_stages").select("resource_id, teaching_stage_id").limit(5000),
    client.from("resource_audiences").select("resource_id, audience").limit(5000),
    client.from("audit_events").select("id, actor_user_id, action, entity_id, created_at, metadata").in("entity_type", ["bls_topic", "teaching_stage"]).order("created_at", { ascending: false }).limit(50),
    client.from("profiles").select("id, full_name").limit(500),
  ]);
  ensureResults([topics, stages, resources, topicAssignments, stageAssignments, audiences, auditEvents, profiles]);
  return assembleResourceTaxonomyCatalog({
    audiences: audiences.data ?? [], auditEvents: auditEvents.data ?? [], profiles: profiles.data ?? [], resources: resources.data ?? [],
    stageAssignments: stageAssignments.data ?? [], stages: stages.data ?? [], topicAssignments: topicAssignments.data ?? [], topics: topics.data ?? [],
  });
}

function tableFor(kind: "topic" | "stage") {
  return kind === "topic" ? "bls_topics" as const : "teaching_stages" as const;
}

function writeError(error: PostgrestError, fallback: string): never {
  if (error.code === "23505") throw new Error("RESOURCE_TAXONOMY_SLUG_CONFLICT");
  if (error.code === "23514") throw new Error("RESOURCE_TAXONOMY_DEACTIVATION_BLOCKED");
  throw new Error(fallback);
}

export async function createResourceTaxonomyItem(client: Client, input: CreateResourceTaxonomyInput) {
  const values = { active: true, description: input.description, display_order: input.displayOrder, name: input.name.trim(), organization_id: input.organizationId, slug: input.slug };
  const { error } = input.kind === "topic" ? await client.from("bls_topics").insert(values) : await client.from("teaching_stages").insert(values);
  if (error) writeError(error, "RESOURCE_TAXONOMY_CREATE_FAILED");
}

export async function updateResourceTaxonomyItem(client: Client, input: UpdateResourceTaxonomyInput) {
  const values = { description: input.description, display_order: input.displayOrder, name: input.name.trim() };
  const { error } = await client.from(tableFor(input.kind)).update(values).eq("id", input.id);
  if (error) writeError(error, "RESOURCE_TAXONOMY_UPDATE_FAILED");
}

export async function setResourceTaxonomyActive(client: Client, input: { active: boolean; id: string; kind: "topic" | "stage" }) {
  const { error } = await client.from(tableFor(input.kind)).update({ active: input.active }).eq("id", input.id);
  if (error) writeError(error, "RESOURCE_TAXONOMY_STATUS_FAILED");
}
