import { useMutation } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import {
  exportRepository,
  type QuizType,
} from "../data/export-repository";

export function useCohortRosterExport() {
  const { client } = useAuth();
  return useMutation({
    mutationFn: async ({
      cohortId,
      requestId,
    }: {
      cohortId: string;
      requestId: string;
    }) => {
      if (!client) throw new Error("Authentication client is required");
      return exportRepository.getCohortRoster(client, cohortId, requestId);
    },
  });
}

export function useAssessmentResultsExport() {
  const { client } = useAuth();
  return useMutation({
    mutationFn: async ({
      cohortId,
      quizType,
      requestId,
    }: {
      cohortId: string;
      quizType: QuizType;
      requestId: string;
    }) => {
      if (!client) throw new Error("Authentication client is required");
      return exportRepository.getAssessmentResults(
        client,
        cohortId,
        quizType,
        requestId
      );
    },
  });
}

export function usePrePostComparisonExport() {
  const { client } = useAuth();
  return useMutation({
    mutationFn: async ({
      cohortId,
      requestId,
    }: {
      cohortId: string;
      requestId: string;
    }) => {
      if (!client) throw new Error("Authentication client is required");
      return exportRepository.getPrePostComparison(client, cohortId, requestId);
    },
  });
}
