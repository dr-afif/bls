import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../../../lib/supabase/database.types";
import type { QuizAttemptPayload, QuizAttemptStart, QuizAvailability, QuizRepository, QuizSubmissionResult } from "../model/quiz-types";

type Client = SupabaseClient<Database>;
const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });
const attemptStatus = z.enum(["in_progress", "submitted", "timed_out", "invalidated"]);
const availabilitySchema = z.array(z.object({
  attemptLimit: z.number().int().positive(), attemptsUsed: z.number().int().nonnegative(),
  availableFrom: timestamp.nullable(), availableUntil: timestamp.nullable(), instructions: z.string().min(1),
  quizId: uuid, released: z.boolean(), timeLimitMinutes: z.number().int().positive(), title: z.string().min(1),
  type: z.enum(["pre_test", "post_test"]), versionId: uuid,
}));
const startSchema = z.object({ attemptId: uuid, expiresAt: timestamp, resumed: z.boolean(), startedAt: timestamp, status: attemptStatus });
const payloadSchema = z.object({
  attemptId: uuid, expiresAt: timestamp,
  questions: z.array(z.object({
    attemptQuestionId: uuid, displayOrder: z.number().int().positive(),
    options: z.array(z.object({ displayOrder: z.number().int().positive(), id: uuid, text: z.string().min(1) })).min(2),
    prompt: z.string().min(1), selectedOptionId: uuid.nullable(), type: z.enum(["single_best_answer", "true_false"]),
  })).min(1), status: attemptStatus,
});
const savedSchema = z.object({ savedAt: timestamp });
const resultSchema = z.object({
  attemptId: uuid, passed: z.boolean().nullable(), scorePercent: z.number().min(0).max(100).nullable(), status: z.literal("submitted"),
  topicSummary: z.array(z.object({ earned: z.number().nonnegative(), percent: z.number().min(0).max(100), possible: z.number().positive(), topicId: uuid })),
});

function parse<T>(schema: z.ZodType<T>, value: unknown, code: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(code);
  return parsed.data;
}
export function parseQuizAvailability(value: unknown): QuizAvailability[] {
  return parse(availabilitySchema, value, "QUIZ_DATA_UNAVAILABLE");
}
export function parseQuizAttempt(value: unknown): QuizAttemptPayload {
  return parse(payloadSchema, value, "QUIZ_ATTEMPT_UNAVAILABLE");
}
function safeQuizError(error: PostgrestError): never {
  const known = [
    "ATTEMPT_ALREADY_SUBMITTED", "ATTEMPT_EXPIRED", "ATTEMPT_LIMIT_REACHED", "ATTEMPT_NOT_EDITABLE",
    "ATTEMPT_NOT_SUBMITTABLE", "INVALID_ANSWER_OPTION", "POST_TEST_NOT_RELEASED", "QUIZ_ACCESS_DENIED",
    "QUIZ_INCOMPLETE", "QUIZ_RATE_LIMITED", "QUIZ_UNAVAILABLE", "QUIZ_WINDOW_CLOSED",
  ].find((code) => error.message.includes(code));
  throw new Error(known ?? "QUIZ_OPERATION_FAILED");
}
async function rpc(client: Client, name: keyof Database["public"]["Functions"], args: Record<string, string>) {
  const result = await client.rpc(name, args as never);
  if (result.error) safeQuizError(result.error);
  return result.data;
}
export function createQuizRepository(client: Client): QuizRepository {
  return {
    async listAvailable() { return parseQuizAvailability(await rpc(client, "list_available_quizzes", {})); },
    async startAttempt(quizId, requestId) {
      return parse<QuizAttemptStart>(startSchema, await rpc(client, "start_quiz_attempt", { target_quiz_id: quizId, target_request_id: requestId }), "QUIZ_START_FAILED");
    },
    async getAttempt(attemptId) {
      return parseQuizAttempt(await rpc(client, "get_quiz_attempt_payload", { target_attempt_id: attemptId }));
    },
    async saveAnswer(attemptQuestionId, attemptOptionId) {
      return parse(savedSchema, await rpc(client, "save_quiz_answer", { target_attempt_option_id: attemptOptionId, target_attempt_question_id: attemptQuestionId }), "QUIZ_SAVE_FAILED");
    },
    async submitAttempt(attemptId, requestId) {
      return parse<QuizSubmissionResult>(resultSchema, await rpc(client, "submit_quiz_attempt", { target_attempt_id: attemptId, target_submission_request_id: requestId }), "QUIZ_SUBMISSION_FAILED");
    },
  };
}
