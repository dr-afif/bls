import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../lib/supabase/database.types";

export type QuizType = Database["public"]["Enums"]["quiz_type"];

export const RosterExportRowSchema = z.object({
  cohortCode: z.string(),
  cohortName: z.string().nullable(),
  learnerName: z.string(),
  membershipStatus: z.string(),
});
export type RosterExportRow = z.infer<typeof RosterExportRowSchema>;

export const AssessmentResultsExportRowSchema = z.object({
  cohortCode: z.string(),
  cohortName: z.string().nullable(),
  learnerName: z.string(),
  assessmentType: z.string(),
  quizTitle: z.string(),
  quizVersionNumber: z.number().nullable(),
  status: z.string(),
  submittedAt: z.string().nullable(),
  scorePercent: z.number().nullable(),
  passed: z.boolean().nullable(),
});
export type AssessmentResultsExportRow = z.infer<typeof AssessmentResultsExportRowSchema>;

export const PrePostComparisonExportRowSchema = z.object({
  cohortCode: z.string(),
  cohortName: z.string().nullable(),
  learnerName: z.string(),
  preTestStatus: z.string(),
  preTestSubmittedAt: z.string().nullable(),
  preTestScorePercent: z.number().nullable(),
  postTestStatus: z.string(),
  postTestSubmittedAt: z.string().nullable(),
  postTestScorePercent: z.number().nullable(),
  postTestPassed: z.boolean().nullable(),
  learningGainPercentagePoints: z.number().nullable(),
});
export type PrePostComparisonExportRow = z.infer<typeof PrePostComparisonExportRowSchema>;

export const exportRepository = {
  async getCohortRoster(
    client: SupabaseClient<Database>,
    cohortId: string,
    requestId: string
  ): Promise<RosterExportRow[]> {
    const { data, error } = await client.rpc("get_admin_cohort_roster_export", {
      target_cohort_id: cohortId,
      target_request_id: requestId,
    });

    if (error) throw error;
    return z.array(RosterExportRowSchema).parse(data);
  },

  async getAssessmentResults(
    client: SupabaseClient<Database>,
    cohortId: string,
    quizType: QuizType,
    requestId: string
  ): Promise<AssessmentResultsExportRow[]> {
    const { data, error } = await client.rpc("get_admin_assessment_results_export", {
      target_cohort_id: cohortId,
      target_quiz_type: quizType,
      target_request_id: requestId,
    });

    if (error) throw error;
    return z.array(AssessmentResultsExportRowSchema).parse(data);
  },

  async getPrePostComparison(
    client: SupabaseClient<Database>,
    cohortId: string,
    requestId: string
  ): Promise<PrePostComparisonExportRow[]> {
    const { data, error } = await client.rpc("get_admin_pre_post_export", {
      target_cohort_id: cohortId,
      target_request_id: requestId,
    });

    if (error) throw error;
    return z.array(PrePostComparisonExportRowSchema).parse(data);
  },
};
