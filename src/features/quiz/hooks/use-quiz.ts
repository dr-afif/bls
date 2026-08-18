import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import { createQuizRepository } from "../data/quiz-repository";

export const quizKeys = {
  all: ["quiz"] as const,
  available: () => [...quizKeys.all, "available"] as const,
  attempt: (attemptId: string) => [...quizKeys.all, "attempt", attemptId] as const,
};

export function useAvailableQuizzes() {
  const { client } = useAuth();
  return useQuery({
    queryKey: quizKeys.available(),
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return createQuizRepository(client).listAvailable();
    },
    enabled: Boolean(client),
  });
}

export function useQuizAttempt(attemptId: string) {
  const { client } = useAuth();
  return useQuery({
    queryKey: quizKeys.attempt(attemptId),
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return createQuizRepository(client).getAttempt(attemptId);
    },
    enabled: Boolean(client && attemptId),
  });
}

export function useStartQuizAttempt() {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, requestId }: { quizId: string; requestId: string }) => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return createQuizRepository(client).startAttempt(quizId, requestId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.available() });
      if (data.attemptId) {
        queryClient.invalidateQueries({ queryKey: quizKeys.attempt(data.attemptId) });
      }
    },
  });
}

export function useSaveQuizAnswer() {
  const { client } = useAuth();

  return useMutation({
    mutationFn: ({
      attemptQuestionId,
      attemptOptionId,
    }: {
      attemptQuestionId: string;
      attemptOptionId: string;
    }) => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return createQuizRepository(client).saveAnswer(attemptQuestionId, attemptOptionId);
    },
  });
}

export function useSubmitQuizAttempt() {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ attemptId, requestId }: { attemptId: string; requestId: string }) => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return createQuizRepository(client).submitAttempt(attemptId, requestId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quizKeys.available() });
      queryClient.invalidateQueries({ queryKey: quizKeys.attempt(variables.attemptId) });
    },
  });
}

export function useQuizAttemptResult(quizId: string) {
  const { client } = useAuth();
  return useQuery({
    queryKey: [...quizKeys.all, "result", quizId],
    queryFn: async () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      const { data, error } = await client
        .from("quiz_attempts")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(quizId),
  });
}
