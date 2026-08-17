import { describe, expect, it } from "vitest";

import { questionDraftSchema, quizDraftSchema } from "./quiz-admin-types";

const topicId = "10000000-0000-4000-8000-000000000001";
const questionId = "20000000-0000-4000-8000-000000000001";

describe("quiz administrator form rules", () => {
  it("accepts a complete single-best-answer question", () => {
    const result = questionDraftSchema.safeParse({
      correctIndex: 1,
      options: [{ text: "Fictional A" }, { text: "Fictional B" }],
      prompt: "Which fictional option is selected?",
      referenceNote: "Non-clinical fixture",
      topicIds: [topicId],
      type: "single_best_answer",
    });
    expect(result.success).toBe(true);
  });

  it("requires exactly two options for true-or-false questions", () => {
    const result = questionDraftSchema.safeParse({
      correctIndex: 0,
      options: [{ text: "True" }, { text: "False" }, { text: "Maybe" }],
      prompt: "A fictional statement.",
      referenceNote: "",
      topicIds: [topicId],
      type: "true_false",
    });
    expect(result.success).toBe(false);
  });

  it("requires a correctness key within the option list", () => {
    const result = questionDraftSchema.safeParse({
      correctIndex: 3,
      options: [{ text: "A" }, { text: "B" }],
      prompt: "A fictional question.",
      referenceNote: "",
      topicIds: [topicId],
      type: "single_best_answer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a quiz window that closes before it opens", () => {
    const result = quizDraftSchema.safeParse({
      attemptLimit: 1,
      availableFrom: "2026-08-18T10:00",
      availableUntil: "2026-08-18T09:00",
      instructions: "Complete this fictional assessment.",
      passingScorePercent: 80,
      questionVersionIds: [questionId],
      randomizeOptions: true,
      timeLimitMinutes: 15,
      title: "Fictional pre-test",
    });
    expect(result.success).toBe(false);
  });
});
