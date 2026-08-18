import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import { quizStaffRepository } from "../data/quiz-staff-repository";

export function useInstructorReadiness(cohortId: string) {
  const { client } = useAuth();
  return useQuery({
    queryKey: ["instructor-readiness", cohortId],
    queryFn: async () => {
      if (!client) throw new Error("Not authenticated");
      return quizStaffRepository.getInstructorReadiness(client, cohortId);
    },
    enabled: !!client && !!cohortId,
  });
}

export function useReleasePostTest() {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cohortId, quizId, requestId }: { cohortId: string; quizId: string; requestId: string }) => {
      if (!client) throw new Error("Not authenticated");
      return quizStaffRepository.releasePostTest(client, cohortId, quizId, requestId);
    },
    onSuccess: (_, { cohortId }) => {
      queryClient.invalidateQueries({ queryKey: ["instructor-readiness", cohortId] });
    },
  });
}

export function useAdminQuizResults(cohortId?: string) {
  const { client } = useAuth();
  return useQuery({
    queryKey: ["admin-quiz-results", cohortId],
    queryFn: async () => {
      if (!client) throw new Error("Not authenticated");
      if (!cohortId) return [];
      return quizStaffRepository.listAdminResults(client, cohortId);
    },
    enabled: !!client && !!cohortId,
  });
}

export function useAdminQuizAttemptDetail(attemptId: string) {
  const { client } = useAuth();
  return useQuery({
    queryKey: ["admin-quiz-attempt", attemptId],
    queryFn: async () => {
      if (!client) throw new Error("Not authenticated");
      return quizStaffRepository.getAdminAttemptDetail(client, attemptId);
    },
    enabled: !!client && !!attemptId,
  });
}
