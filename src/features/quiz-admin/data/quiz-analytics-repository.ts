import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../lib/supabase/database.types";

export const LearnerComparisonSchema = z.object({
  learnerId: z.string(),
  learnerName: z.string(),
  preTest: z.object({
    attemptId: z.string().nullable(),
    scorePercent: z.number().nullable(),
    submittedAt: z.string().nullable(),
  }),
  postTest: z.object({
    attemptId: z.string().nullable(),
    scorePercent: z.number().nullable(),
    submittedAt: z.string().nullable(),
  }),
  learningGain: z.number().nullable(),
});
export type LearnerComparison = z.infer<typeof LearnerComparisonSchema>;

export const CohortAggregateComparisonSchema = z.object({
  totalLearners: z.number(),
  pairedResultCount: z.number(),
  preTest: z.object({
    averageScorePercent: z.number().nullable(),
    medianScorePercent: z.number().nullable(),
    completionCount: z.number(),
  }),
  postTest: z.object({
    averageScorePercent: z.number().nullable(),
    medianScorePercent: z.number().nullable(),
    completionCount: z.number(),
    passedCount: z.number(),
  }),
  averageLearningGain: z.number().nullable(),
});
export type CohortAggregateComparison = z.infer<typeof CohortAggregateComparisonSchema>;

export const TopicComparisonSchema = z.object({
  topicId: z.string(),
  topicName: z.string(),
  preTest: z.object({
    submittedLearnerCount: z.number(),
    scoredResponseCount: z.number(),
    correctResponseCount: z.number(),
    percentage: z.number().nullable(),
  }),
  postTest: z.object({
    submittedLearnerCount: z.number(),
    scoredResponseCount: z.number(),
    correctResponseCount: z.number(),
    percentage: z.number().nullable(),
  }),
  learningGain: z.number().nullable(),
});
export type TopicComparison = z.infer<typeof TopicComparisonSchema>;

export const quizAnalyticsRepository = {
  async getCohortLearnerComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<LearnerComparison[]> {
    const { data, error } = await client.rpc("get_admin_cohort_learner_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return z.array(LearnerComparisonSchema).parse(data);
  },

  async getCohortAggregateComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<CohortAggregateComparison> {
    const { data, error } = await client.rpc("get_admin_cohort_aggregate_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return CohortAggregateComparisonSchema.parse(data);
  },

  async getCohortTopicComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<TopicComparison[]> {
    const { data, error } = await client.rpc("get_admin_cohort_topic_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return z.array(TopicComparisonSchema).parse(data);
  },
};
