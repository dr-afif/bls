import { describe, expect, it } from "vitest";

import { parseQuizAttempt, parseQuizAvailability } from "./quiz-repository";

const quizId = "00000000-0000-4000-8000-000000000001";
const versionId = "00000000-0000-4000-8000-000000000002";
const attemptId = "00000000-0000-4000-8000-000000000003";
const questionId = "00000000-0000-4000-8000-000000000004";
const optionOne = "00000000-0000-4000-8000-000000000005";
const optionTwo = "00000000-0000-4000-8000-000000000006";

describe("quiz repository payload validation", () => {
  it("accepts the learner-safe availability contract", () => {
    expect(parseQuizAvailability([{
      attemptLimit: 1, attemptsUsed: 0, availableFrom: null, availableUntil: null,
      instructions: "Fictional instructions", quizId, released: false, timeLimitMinutes: 10,
      title: "Post-test", type: "post_test", versionId,
    }])).toHaveLength(1);
  });

  it("rejects malformed frozen option data", () => {
    expect(() => parseQuizAttempt({
      attemptId, expiresAt: "2026-08-17T05:00:00+00:00",
      questions: [{ attemptQuestionId: questionId, displayOrder: 1,
        options: [{ displayOrder: 1, id: optionOne, text: "Only option" }],
        prompt: "Fictional question", selectedOptionId: null, type: "single_best_answer" }],
      status: "in_progress",
    })).toThrow("QUIZ_ATTEMPT_UNAVAILABLE");
  });

  it("accepts frozen questions without any answer-key field", () => {
    const result = parseQuizAttempt({
      attemptId, expiresAt: "2026-08-17T05:00:00+00:00",
      questions: [{ attemptQuestionId: questionId, displayOrder: 1,
        options: [{ displayOrder: 1, id: optionOne, text: "Option A" }, { displayOrder: 2, id: optionTwo, text: "Option B" }],
        prompt: "Fictional question", selectedOptionId: null, type: "single_best_answer" }],
      status: "in_progress",
    });
    expect(result.questions[0].options).toHaveLength(2);
    expect(JSON.stringify(result)).not.toMatch(/correct/i);
  });
});
