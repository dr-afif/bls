import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import { createCohort, listPeople } from "./people-cohorts-repository";

function result(data: unknown) {
  return { data, error: null };
}

describe("People and Cohorts repository", () => {
  it("combines RLS-filtered profile, role, membership, and cohort records", async () => {
    const responses = [
      result([{ id: "person-1", full_name: "Learner One", staff_id: "S1", profession: "Nurse", department: "ED", account_status: "active" }]),
      result([{ user_id: "person-1", role: "learner" }]),
      result([{ cohort_id: "cohort-1", user_id: "person-1", member_role: "learner", membership_status: "active" }]),
      result([{ id: "cohort-1", code: "BLS-01", name: "Provider course" }]),
    ];
    let index = 0;
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(async () => responses[index++]), then: (resolve: (value: unknown) => void) => resolve(responses[index++]) })) })) } as unknown as SupabaseClient<Database>;

    const people = await listPeople(client);
    expect(people[0]).toMatchObject({ fullName: "Learner One", roles: ["learner"], memberships: [{ cohortCode: "BLS-01" }] });
  });

  it("normalizes cohort input before inserting", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const maybeSingle = vi.fn().mockResolvedValue(result({ id: "course-1" }));
    const courseQuery = {
      select: vi.fn(() => courseQuery),
      eq: vi.fn(() => courseQuery),
      order: vi.fn(() => courseQuery),
      limit: vi.fn(() => courseQuery),
      maybeSingle,
    };
    const client = {
      from: vi.fn((table: string) => table === "courses" ? courseQuery : { insert }),
    } as unknown as SupabaseClient<Database>;
    await createCohort(client, {
      organizationId: "org-1", actorUserId: "admin-1", code: " bls-01 ", name: " Provider Course ", venue: " Skills Lab ", startAt: "2026-08-22T00:30:00.000Z", endAt: "2026-08-22T08:30:00.000Z",
    });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      course_id: "course-1", code: "BLS-01", name: "Provider Course",
      venue: "Skills Lab", status: "scheduled",
    }));
  });
});
