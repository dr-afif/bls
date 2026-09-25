import { describe, expect, it } from "vitest";

import { assembleResourceTaxonomyCatalog, type ResourceTaxonomyRows } from "./resource-taxonomy-repository";

const organizationId = "00000000-0000-4000-8000-000000000001";
const topicA = "00000000-0000-4000-8000-000000000011";
const topicB = "00000000-0000-4000-8000-000000000012";
const stageA = "00000000-0000-4000-8000-000000000021";
const stageB = "00000000-0000-4000-8000-000000000022";
const resourceA = "00000000-0000-4000-8000-000000000031";
const resourceB = "00000000-0000-4000-8000-000000000032";

function topic(id: string, name: string, active: boolean, order: number): ResourceTaxonomyRows["topics"][number] {
  return { active, created_at: "2026-08-17T00:00:00Z", description: null, display_order: order, id, name, organization_id: organizationId, slug: name.toLowerCase().replaceAll(" ", "-"), updated_at: "2026-08-17T00:00:00Z" };
}

function stage(id: string, name: string, active: boolean, order: number): ResourceTaxonomyRows["stages"][number] {
  return { active, created_at: "2026-08-17T00:00:00Z", description: null, display_order: order, id, name, organization_id: organizationId, slug: name.toLowerCase().replaceAll(" ", "-"), updated_at: "2026-08-17T00:00:00Z" };
}

describe("resource taxonomy catalog assembly", () => {
  it("reports usage and deactivation blockers for published resources", () => {
    const rows: ResourceTaxonomyRows = {
      audiences: [{ audience: "instructor", resource_id: resourceA }, { audience: "learner", resource_id: resourceB }],
      auditEvents: [],
      profiles: [],
      resources: [{ id: resourceA, status: "published" }, { id: resourceB, status: "draft" }],
      stageAssignments: [{ resource_id: resourceA, teaching_stage_id: stageA }],
      stages: [stage(stageA, "Demonstration", true, 1), stage(stageB, "Debrief", true, 2)],
      topicAssignments: [{ resource_id: resourceA, topic_id: topicA }, { resource_id: resourceB, topic_id: topicA }, { resource_id: resourceB, topic_id: topicB }],
      topics: [topic(topicB, "Adult CPR", true, 2), topic(topicA, "Core BLS", true, 1)],
    };

    const result = assembleResourceTaxonomyCatalog(rows);

    expect(result.topics.map((item) => item.name)).toEqual(["Core BLS", "Adult CPR"]);
    expect(result.topics[0]).toMatchObject({ blockingPublishedResourceCount: 1, publishedUsageCount: 1, usageCount: 2 });
    expect(result.stages[0]).toMatchObject({ blockingPublishedResourceCount: 1, publishedUsageCount: 1, usageCount: 1 });
    expect(result.stages[1]).toMatchObject({ blockingPublishedResourceCount: 0, usageCount: 0 });
  });

  it("does not block deactivation when another active classification protects publication", () => {
    const rows: ResourceTaxonomyRows = {
      audiences: [{ audience: "instructor", resource_id: resourceA }],
      auditEvents: [{ action: "resource_taxonomy.topic_updated", actor_user_id: "admin", created_at: "2026-08-17T00:00:00Z", entity_id: topicA, id: "event", metadata: { name: "Core BLS" } }],
      profiles: [{ full_name: "Fictional Admin", id: "admin" }],
      resources: [{ id: resourceA, status: "published" }],
      stageAssignments: [{ resource_id: resourceA, teaching_stage_id: stageA }, { resource_id: resourceA, teaching_stage_id: stageB }],
      stages: [stage(stageA, "Demonstration", true, 1), stage(stageB, "Debrief", true, 2)],
      topicAssignments: [{ resource_id: resourceA, topic_id: topicA }, { resource_id: resourceA, topic_id: topicB }],
      topics: [topic(topicA, "Core BLS", true, 1), topic(topicB, "Adult CPR", true, 2)],
    };

    const result = assembleResourceTaxonomyCatalog(rows);

    expect(result.topics.every((item) => item.blockingPublishedResourceCount === 0)).toBe(true);
    expect(result.stages.every((item) => item.blockingPublishedResourceCount === 0)).toBe(true);
    expect(result.auditEvents[0]).toMatchObject({ actorName: "Fictional Admin", itemName: "Core BLS" });
  });

  it("keeps audit actor locale-neutral in data and resolves fallbacks correctly across locales without translation of real names", async () => {
    const { en } = await import("../../../lib/i18n/en");
    const { ms } = await import("../../../lib/i18n/ms");

    const rows: ResourceTaxonomyRows = {
      audiences: [],
      auditEvents: [
        { action: "resource_taxonomy.topic_created", actor_user_id: "user-1", created_at: "2026-08-17T00:00:00Z", entity_id: topicA, id: "event-1", metadata: { name: "Core BLS" } },
        { action: "resource_taxonomy.topic_updated", actor_user_id: "user-2", created_at: "2026-08-17T00:00:00Z", entity_id: topicA, id: "event-2", metadata: { name: "Core BLS" } },
        { action: "resource_taxonomy.topic_updated", actor_user_id: null, created_at: "2026-08-17T00:00:00Z", entity_id: topicA, id: "event-3", metadata: { name: "Core BLS" } },
      ],
      profiles: [{ full_name: "Dr. Siti Aminah", id: "user-1" }],
      resources: [],
      stageAssignments: [],
      stages: [],
      topicAssignments: [],
      topics: [],
    };

    const result = assembleResourceTaxonomyCatalog(rows);

    // Data layer is strictly locale-neutral:
    expect(result.auditEvents[0]).toMatchObject({ actorName: "Dr. Siti Aminah", actorUserId: "user-1" });
    expect(result.auditEvents[1]).toMatchObject({ actorName: null, actorUserId: "user-2" });
    expect(result.auditEvents[2]).toMatchObject({ actorName: null, actorUserId: null });

    // UI presentation resolution logic (matches resource-taxonomy-page.tsx and resource-detail-page.tsx)
    function resolveActorLabel(event: typeof result.auditEvents[number], dict: Record<string, string>) {
      return event.actorName ?? (event.actorUserId ? dict["common.authorizedSystemActor"] : dict["common.system"]);
    }

    // English UI resolution
    expect(resolveActorLabel(result.auditEvents[0], en)).toBe("Dr. Siti Aminah");
    expect(resolveActorLabel(result.auditEvents[1], en)).toBe("Authorized system actor");
    expect(resolveActorLabel(result.auditEvents[2], en)).toBe("System");

    // Bahasa Melayu UI resolution (without repository refetch)
    expect(resolveActorLabel(result.auditEvents[0], ms)).toBe("Dr. Siti Aminah"); // Authored name remains unchanged
    expect(resolveActorLabel(result.auditEvents[1], ms)).toBe("Pelaku sistem dibenarkan");
    expect(resolveActorLabel(result.auditEvents[2], ms)).toBe("Sistem");
  });
});
