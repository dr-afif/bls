import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../../lib/supabase/database.types";

export type LearnerComparison = {
  learnerId: string;
  learnerName: string;
  preTest: {
    attemptId: string | null;
    scorePercent: number | null;
    submittedAt: string | null;
  };
  postTest: {
    attemptId: string | null;
    scorePercent: number | null;
    submittedAt: string | null;
  };
  learningGain: number | null;
};

export type CohortAggregateComparison = {
  preTest: {
    averageScorePercent: number | null;
    completionCount: number;
    totalLearners: number;
  };
  postTest: {
    averageScorePercent: number | null;
    completionCount: number;
    totalLearners: number;
  };
  averageLearningGain: number | null;
};

export type TopicComparison = {
  topicId: string;
  topicName: string;
  preTest: {
    correctCount: number;
    totalQuestions: number;
    averagePercent: number | null;
  };
  postTest: {
    correctCount: number;
    totalQuestions: number;
    averagePercent: number | null;
  };
  learningGain: number | null;
};

export const quizAnalyticsRepository = {
  async getCohortLearnerComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<LearnerComparison[]> {
    const { data, error } = await client.rpc("get_admin_cohort_learner_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return (data as unknown) as LearnerComparison[];
  },

  async getCohortAggregateComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<CohortAggregateComparison> {
    const { data, error } = await client.rpc("get_admin_cohort_aggregate_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return (data as unknown) as CohortAggregateComparison;
  },

  async getCohortTopicComparison(
    client: SupabaseClient<Database>,
    cohortId: string
  ): Promise<TopicComparison[]> {
    const { data, error } = await client.rpc("get_admin_cohort_topic_comparison", {
      target_cohort_id: cohortId,
    });
    if (error) throw error;
    return (data as unknown) as TopicComparison[];
  },
};
