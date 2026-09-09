import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums } from "../../../lib/supabase/database.types";
import type {
  CreateCohortInput,
  MemberRole,
  OperationsCohort,
  OperationsPerson,
} from "../model/operations-types";

function assertResults(results: Array<{ error: unknown }>) {
  if (results.some(({ error }) => error)) throw new Error("OPERATIONS_DATA_UNAVAILABLE");
}

export async function listPeople(client: SupabaseClient<Database>): Promise<OperationsPerson[]> {
  const [profiles, roles, memberships, cohorts] = await Promise.all([
    client.from("profiles").select("id, full_name, staff_id, profession, department, account_status").order("full_name"),
    client.from("user_roles").select("user_id, role"),
    client.from("cohort_members").select("cohort_id, user_id, member_role, membership_status"),
    client.from("cohorts").select("id, code, name"),
  ]);
  assertResults([profiles, roles, memberships, cohorts]);

  const cohortById = new Map((cohorts.data ?? []).map((cohort) => [cohort.id, cohort]));
  return (profiles.data ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    staffId: profile.staff_id,
    profession: profile.profession,
    department: profile.department,
    accountStatus: profile.account_status,
    roles: (roles.data ?? []).filter((role) => role.user_id === profile.id).map((role) => role.role),
    memberships: (memberships.data ?? [])
      .filter((membership) => membership.user_id === profile.id)
      .flatMap((membership) => {
        const cohort = cohortById.get(membership.cohort_id);
        return cohort ? [{
          cohortId: cohort.id,
          cohortCode: cohort.code,
          cohortName: cohort.name,
          memberRole: membership.member_role,
          status: membership.membership_status,
        }] : [];
      }),
  }));
}

export async function listCohorts(client: SupabaseClient<Database>): Promise<OperationsCohort[]> {
  const [cohorts, memberships, profiles] = await Promise.all([
    client.from("cohorts").select("id, organization_id, code, name, description, venue, start_at, end_at, status, contact_name, contact_phone, preparation_notes").order("start_at"),
    client.from("cohort_members").select("cohort_id, user_id, member_role, membership_status"),
    client.from("profiles").select("id, full_name"),
  ]);
  assertResults([cohorts, memberships, profiles]);
  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

  return (cohorts.data ?? []).map((cohort) => ({
    id: cohort.id,
    organizationId: cohort.organization_id,
    code: cohort.code,
    name: cohort.name,
    description: cohort.description,
    venue: cohort.venue,
    startAt: cohort.start_at,
    endAt: cohort.end_at,
    status: cohort.status,
    contactName: cohort.contact_name,
    contactPhone: cohort.contact_phone,
    preparationNotes: cohort.preparation_notes,
    members: (memberships.data ?? [])
      .filter((membership) => membership.cohort_id === cohort.id)
      .flatMap((membership) => {
        const profile = profileById.get(membership.user_id);
        return profile ? [{
          userId: profile.id,
          fullName: profile.full_name,
          memberRole: membership.member_role,
          status: membership.membership_status,
        }] : [];
      }),
  }));
}

export async function createCohort(client: SupabaseClient<Database>, input: CreateCohortInput) {
  const { data: course, error: courseError } = await client
    .from("courses")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("status", "published")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (courseError || !course) throw new Error("COHORT_COURSE_UNAVAILABLE");

  const { error } = await client.from("cohorts").insert({
    organization_id: input.organizationId,
    course_id: course.id,
    created_by: input.actorUserId,
    code: input.code.trim().toUpperCase(),
    name: input.name.trim(),
    venue: input.venue.trim(),
    start_at: input.startAt,
    end_at: input.endAt,
    status: "scheduled",
    contact_name: input.contactName?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    preparation_notes: input.preparationNotes?.trim() || null,
  });
  if (error) throw new Error("COHORT_CREATE_FAILED");
}

export async function assignCohortMember(
  client: SupabaseClient<Database>,
  input: { actorUserId: string; cohortId: string; userId: string; memberRole: MemberRole },
) {
  const { error } = await client.from("cohort_members").insert({
    cohort_id: input.cohortId,
    user_id: input.userId,
    member_role: input.memberRole,
    added_by: input.actorUserId,
  });
  if (error) throw new Error("COHORT_ASSIGNMENT_FAILED");
}

export async function updateCohortStatus(
  client: SupabaseClient<Database>,
  cohortId: string,
  status: Enums<"cohort_status">,
) {
  const { error } = await client.from("cohorts").update({ status }).eq("id", cohortId);
  if (error) throw new Error("COHORT_STATUS_UPDATE_FAILED");
}

export async function updateMembershipStatus(
  client: SupabaseClient<Database>,
  input: { cohortId: string; userId: string; status: Enums<"membership_status"> },
) {
  const { error } = await client.from("cohort_members").update({ membership_status: input.status }).eq("cohort_id", input.cohortId).eq("user_id", input.userId);
  if (error) throw new Error("MEMBERSHIP_STATUS_UPDATE_FAILED");
}

export async function updateAccountStatus(
  client: SupabaseClient<Database>,
  userId: string,
  accountStatus: Enums<"account_status">,
) {
  const { error } = await client.from("profiles").update({ account_status: accountStatus }).eq("id", userId);
  if (error) throw new Error("ACCOUNT_STATUS_UPDATE_FAILED");
}

export type InviteUserInput = {
  email: string;
  fullName: string;
  role: "learner" | "instructor";
  accessMode: "unlimited" | "limited";
  startsAt?: string | null;
  expiresAt?: string | null;
  organizationId?: string | null;
};

export type InvitedUserResult = {
  id: string;
  email: string;
  fullName: string;
  role: "learner" | "instructor";
  organizationId: string;
};

export async function inviteUser(
  client: SupabaseClient<Database>,
  input: InviteUserInput,
): Promise<InvitedUserResult> {
  const { data, error } = await client.functions.invoke("admin-invite-user", {
    body: input,
  });

  if (error) {
    const context = typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: unknown }).context
      : null;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json();
        if (body?.code) throw new Error(body.code);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "INVITATION_FAILED") {
          throw parseErr;
        }
        if (context.status === 409) throw new Error("USER_ALREADY_EXISTS");
        if (context.status === 403) throw new Error("FORBIDDEN");
        if (context.status === 401) throw new Error("AUTHENTICATION_REQUIRED");
        if (context.status === 400) throw new Error("INVALID_REQUEST");
      }
    }
    throw new Error("INVITATION_FAILED");
  }

  if (!data?.success || !data?.user) {
    throw new Error("INVITATION_FAILED");
  }

  return data.user as InvitedUserResult;
}
