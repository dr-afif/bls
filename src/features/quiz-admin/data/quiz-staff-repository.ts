import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../lib/supabase/database.types";

export type CohortAssessmentReadiness = {
  learnerId: string;
  learnerName: string;
  preTest: {
    available: boolean;
    status: "not_started" | "in_progress" | "submitted" | "timed_out" | "invalidated";
  };
  postTest: {
    quizId?: string;
    released: boolean;
    releasedAt?: string;
    status: "not_started" | "in_progress" | "submitted" | "timed_out" | "invalidated";
  };
};

export type AdminQuizResult = {
  attemptId: string;
  learnerId: string;
  learnerName: string;
  quizTitle: string;
  quizType: "pre_test" | "post_test";
  status: "in_progress" | "submitted" | "timed_out" | "invalidated";
  startedAt: string;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
};

export type AdminQuizAttemptDetail = {
  attemptId: string;
  learnerId: string;
  learnerName: string;
  cohortId: string;
  quizId: string;
  quizTitle: string;
  quizType: "pre_test" | "post_test";
  status: "in_progress" | "submitted" | "timed_out" | "invalidated";
  startedAt: string;
  submittedAt?: string;
  scorePercent?: number;
  passed?: boolean;
  topicSummary: { topicId: string; earned: number; possible: number; percent: number }[];
  questions: {
    attemptQuestionId: string;
    prompt: string;
    type: "single_best_answer" | "true_false";
    displayOrder: number;
    points: number;
    topicId?: string;
    selectedOptionId?: string;
    isCorrect?: boolean;
    pointsAwarded?: number;
    options: {
      id: string;
      text: string;
      displayOrder: number;
      isCorrect?: boolean;
    }[];
  }[];
};

export const quizStaffRepository = {
  async getInstructorReadiness(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<CohortAssessmentReadiness[]> {
    const { data, error } = await client.rpc("get_instructor_cohort_assessment_readiness", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return (data as unknown) as CohortAssessmentReadiness[];
  },

  async releasePostTest(
    client: SupabaseClient<Database>,
    cohortId: string,
    quizId: string,
    requestId: string
  ): Promise<{ releaseId: string; released: boolean }> {
    const { data, error } = await client.rpc("release_cohort_post_test", {
      target_cohort_id: cohortId,
      target_quiz_id: quizId,
      target_request_id: requestId,
    });
    if (error) throw error;
    return (data as unknown) as { releaseId: string; released: boolean };
  },

  async listAdminResults(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<AdminQuizResult[]> {
    const { data, error } = await client.rpc("list_admin_quiz_results", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return (data as unknown) as AdminQuizResult[];
  },

  async getAdminAttemptDetail(
    client: SupabaseClient<Database>,
    attemptId: string
  ): Promise<AdminQuizAttemptDetail> {
    const { data, error } = await client.rpc("get_admin_quiz_attempt_detail", {
      target_attempt_id: attemptId,
    });
    if (error) throw error;
    return (data as unknown) as AdminQuizAttemptDetail;
  },
};
