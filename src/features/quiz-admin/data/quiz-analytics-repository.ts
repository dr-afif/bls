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

export const ItemOptionAnalysisSchema = z.object({
  questionOptionId: z.string(),
  optionText: z.string(),
  displayOrder: z.number(),
  selectedCount: z.number(),
  selectionPercent: z.number().nullable(),
  isCorrect: z.boolean(),
});
export type ItemOptionAnalysis = z.infer<typeof ItemOptionAnalysisSchema>;

export const ItemAnalysisSchema = z.object({
  questionId: z.string(),
  questionVersionId: z.string(),
  questionVersionNumber: z.number(),
  prompt: z.string(),
  topicId: z.string().nullable(),
  topicName: z.string().nullable(),
  responseCount: z.number(),
  correctResponseCount: z.number(),
  correctResponseRate: z.number().nullable(),
  options: z.array(ItemOptionAnalysisSchema),
});
export type ItemAnalysis = z.infer<typeof ItemAnalysisSchema>;

export const CohortItemAnalysisSchema = z.object({
  cohortId: z.string(),
  quizId: z.string(),
  quizType: z.enum(["pre_test", "post_test"]),
  analyzedLearnerCount: z.number(),
  items: z.array(ItemAnalysisSchema),
});
export type CohortItemAnalysis = z.infer<typeof CohortItemAnalysisSchema>;

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

  async getCohortItemAnalysis(
    client: SupabaseClient<Database>,
    cohortId: string,
    quizType: "pre_test" | "post_test"
  ): Promise<CohortItemAnalysis> {
    const { data, error } = await client.rpc("get_admin_cohort_item_analysis", {
      target_cohort_id: cohortId,
      target_quiz_type: quizType,
    });
    if (error) throw error;
    return CohortItemAnalysisSchema.parse(data);
  },
};
