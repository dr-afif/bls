import type { Enums } from "../../../lib/supabase/database.types";

export type CohortStatus = Enums<"cohort_status">;
export type MemberRole = Enums<"cohort_member_role">;
export type MembershipStatus = Enums<"membership_status">;

export type OperationsPerson = {
  id: string;
  fullName: string;
  staffId: string | null;
  profession: string | null;
  department: string | null;
  accountStatus: Enums<"account_status">;
  roles: Enums<"app_role">[];
  memberships: Array<{
    cohortId: string;
    cohortCode: string;
    cohortName: string;
    memberRole: MemberRole;
    status: MembershipStatus;
  }>;
};

export type OperationsCohort = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  venue: string | null;
  startAt: string;
  endAt: string;
  status: CohortStatus;
  contactName: string | null;
  contactPhone: string | null;
  preparationNotes: string | null;
  members: Array<{
    userId: string;
    fullName: string;
    memberRole: MemberRole;
    status: MembershipStatus;
  }>;
};

export type CreateCohortInput = {
  organizationId: string;
  actorUserId: string;
  code: string;
  name: string;
  venue: string;
  startAt: string;
  endAt: string;
  contactName?: string;
  contactPhone?: string;
  preparationNotes?: string;
};
