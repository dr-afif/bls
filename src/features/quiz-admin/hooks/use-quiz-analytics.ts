import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/context/auth-context";
import { quizAnalyticsRepository } from "../data/quiz-analytics-repository";

export function useCohortLearnerComparison(cohortId: string | null) {
  const { client } = useAuth();

  return useQuery({
    queryKey: ["cohort-learner-comparison", cohortId],
    queryFn: () => {
      if (!cohortId) throw new Error("Cohort ID is required");
      return quizAnalyticsRepository.getCohortLearnerComparison(client!, cohortId);
    },
    enabled: !!cohortId,
  });
}

export function useCohortAggregateComparison(cohortId: string | null) {
  const { client } = useAuth();

  return useQuery({
    queryKey: ["cohort-aggregate-comparison", cohortId],
    queryFn: () => {
      if (!cohortId) throw new Error("Cohort ID is required");
      return quizAnalyticsRepository.getCohortAggregateComparison(client!, cohortId);
    },
    enabled: !!cohortId,
  });
}

export function useCohortTopicComparison(cohortId: string | null) {
  const { client } = useAuth();

  return useQuery({
    queryKey: ["cohort-topic-comparison", cohortId],
    queryFn: () => {
      if (!cohortId) throw new Error("Cohort ID is required");
      return quizAnalyticsRepository.getCohortTopicComparison(client!, cohortId);
    },
    enabled: !!cohortId,
  });
}
