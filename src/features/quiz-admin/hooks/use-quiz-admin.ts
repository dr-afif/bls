import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../auth/context/auth-context";
import * as repository from "../data/quiz-admin-repository";

const queryKey = ["quiz-admin"] as const;

export function useQuizAdminCatalog() {
  const { client } = useAuth();
  return useQuery({
    enabled: Boolean(client),
    queryFn: () => {
      if (!client) throw new Error("AUTHENTICATION_REQUIRED");
      return repository.listQuizAdminCatalog(client);
    },
    queryKey,
  });
}

export function useQuizAdminMutations() {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const requiredClient = () => {
    if (!client) throw new Error("AUTHENTICATION_REQUIRED");
    return client;
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  return {
    createQuestion: useMutation({ mutationFn: (input: Parameters<typeof repository.createQuestion>[1]) => repository.createQuestion(requiredClient(), input), onSuccess: invalidate }),
    createQuestionVersion: useMutation({ mutationFn: (id: string) => repository.createQuestionVersion(requiredClient(), id), onSuccess: invalidate }),
    createQuiz: useMutation({ mutationFn: (input: Parameters<typeof repository.createQuiz>[1]) => repository.createQuiz(requiredClient(), input), onSuccess: invalidate }),
    createQuizVersion: useMutation({ mutationFn: (id: string) => repository.createQuizVersion(requiredClient(), id), onSuccess: invalidate }),
    publishQuestion: useMutation({ mutationFn: (id: string) => repository.publishQuestion(requiredClient(), id), onSuccess: invalidate }),
    publishQuiz: useMutation({ mutationFn: (id: string) => repository.publishQuiz(requiredClient(), id), onSuccess: invalidate }),
    releasePostTest: useMutation({ mutationFn: ({ cohortId, quizId }: { cohortId: string; quizId: string }) => repository.releasePostTest(requiredClient(), cohortId, quizId), onSuccess: invalidate }),
    updateQuestion: useMutation({ mutationFn: ({ input, versionId }: { input: Parameters<typeof repository.updateQuestionDraft>[2]; versionId: string }) => repository.updateQuestionDraft(requiredClient(), versionId, input), onSuccess: invalidate }),
    updateQuiz: useMutation({ mutationFn: ({ input, versionId }: { input: Parameters<typeof repository.updateQuizDraft>[2]; versionId: string }) => repository.updateQuizDraft(requiredClient(), versionId, input), onSuccess: invalidate }),
  };
}
