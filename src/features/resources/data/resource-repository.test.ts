import { describe, expect, it } from "vitest";

import { assembleResourceCatalog } from "./resource-repository";

describe("assembleResourceCatalog", () => {
  it("assembles immutable resource versions with ordered taxonomy and relations", () => {
    const resources = assembleResourceCatalog({
      resources: [{ id: "resource-1", current_version_id: "version-1", slug: "scene-safety", title: "Old title", resource_type: "checklist", estimated_minutes: 2, featured: true }],
      versions: [{ id: "version-1", resource_id: "resource-1", version_number: 1, resource_type: "checklist", title: "Scene safety", summary: "Safe approach", content: { items: ["Check hazards"] }, guideline_source: "Fictional", guideline_year: 2026, reviewed_at: null, next_review_at: null, youtube_video_id: null }],
      topicAssignments: [{ resource_id: "resource-1", topic_id: "topic-1", display_order: 10 }],
      topics: [{ id: "topic-1", name: "Recognition", slug: "recognition", display_order: 1 }],
      stageAssignments: [{ resource_id: "resource-1", teaching_stage_id: "stage-1", display_order: 20 }],
      stages: [{ id: "stage-1", name: "Reinforce", slug: "reinforce", display_order: 4 }],
      relations: [{ resource_id: "resource-1", related_resource_id: "resource-2", display_order: 10 }],
    });

    expect(resources).toEqual([expect.objectContaining({
      title: "Scene safety",
      content: { kind: "checklist", items: ["Check hazards"] },
      topics: [expect.objectContaining({ name: "Recognition", displayOrder: 10 })],
      teachingStages: [expect.objectContaining({ name: "Reinforce", displayOrder: 20 })],
      relatedResourceIds: ["resource-2"],
    })]);
  });

  it("fails closed when a structured snapshot is malformed", () => {
    expect(() => assembleResourceCatalog({
      resources: [{ id: "resource-1", current_version_id: "version-1", slug: "guide", title: "Guide", resource_type: "guide", estimated_minutes: null, featured: false }],
      versions: [{ id: "version-1", resource_id: "resource-1", version_number: 1, resource_type: "guide", title: "Guide", summary: "Summary", content: { sections: [] }, guideline_source: null, guideline_year: null, reviewed_at: null, next_review_at: null, youtube_video_id: null }],
      topicAssignments: [], topics: [], stageAssignments: [], stages: [], relations: [],
    })).toThrow("RESOURCE_DATA_UNAVAILABLE");
  });
});
