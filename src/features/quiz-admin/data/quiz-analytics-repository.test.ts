import { describe, it, expect } from "vitest";
import { LearnerComparisonSchema, CohortAggregateComparisonSchema, TopicComparisonSchema } from "./quiz-analytics-repository";

describe("Quiz Analytics Zod Schemas", () => {
  it("parses a valid learner comparison", () => {
    const data = {
      learnerId: "10000000-0000-0000-0000-000000000001",
      learnerName: "Test Learner",
      preTest: {
        attemptId: "20000000-0000-0000-0000-000000000001",
        scorePercent: 60,
        submittedAt: "2026-08-18T12:00:00Z"
      },
      postTest: {
        attemptId: "20000000-0000-0000-0000-000000000002",
        scorePercent: 80,
        submittedAt: "2026-08-18T13:00:00Z"
      },
      learningGain: 20
    };
    expect(() => LearnerComparisonSchema.parse(data)).not.toThrow();
  });

  it("parses a learner comparison with null assessments", () => {
    const data = {
      learnerId: "10000000-0000-0000-0000-000000000001",
      learnerName: "Test Learner",
      preTest: {
        attemptId: null,
        scorePercent: null,
        submittedAt: null
      },
      postTest: {
        attemptId: null,
        scorePercent: null,
        submittedAt: null
      },
      learningGain: null
    };
    expect(() => LearnerComparisonSchema.parse(data)).not.toThrow();
  });

  it("fails on malformed learner comparison", () => {
    const data = {
      learnerId: "not-a-uuid",
      learnerName: "Test Learner",
      preTest: null,
      postTest: null,
      learningGain: "invalid"
    };
    expect(() => LearnerComparisonSchema.parse(data)).toThrow();
  });

  it("parses a valid cohort aggregate", () => {
    const data = {
      totalLearners: 10,
      pairedResultCount: 8,
      preTest: {
        averageScorePercent: 60,
        medianScorePercent: 60,
        completionCount: 9
      },
      postTest: {
        averageScorePercent: 80,
        medianScorePercent: 80,
        completionCount: 8,
        passedCount: 7
      },
      averageLearningGain: 20
    };
    expect(() => CohortAggregateComparisonSchema.parse(data)).not.toThrow();
  });

  it("parses an empty cohort aggregate", () => {
    const data = {
      totalLearners: 0,
      pairedResultCount: 0,
      preTest: {
        averageScorePercent: null,
        medianScorePercent: null,
        completionCount: 0
      },
      postTest: {
        averageScorePercent: null,
        medianScorePercent: null,
        completionCount: 0,
        passedCount: 0
      },
      averageLearningGain: null
    };
    expect(() => CohortAggregateComparisonSchema.parse(data)).not.toThrow();
  });

  it("fails on malformed cohort aggregate", () => {
    const data = {
      totalLearners: "0",
      pairedResultCount: 0,
    };
    expect(() => CohortAggregateComparisonSchema.parse(data)).toThrow();
  });

  it("parses a valid topic comparison", () => {
    const data = {
      topicId: "30000000-0000-0000-0000-000000000001",
      topicName: "Airway",
      preTest: {
        submittedLearnerCount: 5,
        scoredResponseCount: 10,
        correctResponseCount: 6,
        percentage: 60
      },
      postTest: {
        submittedLearnerCount: 5,
        scoredResponseCount: 10,
        correctResponseCount: 8,
        percentage: 80
      },
      learningGain: 20
    };
    expect(() => TopicComparisonSchema.parse(data)).not.toThrow();
  });

  it("parses topic comparison with missing assessments", () => {
    const data = {
      topicId: "30000000-0000-0000-0000-000000000001",
      topicName: "Airway",
      preTest: {
        submittedLearnerCount: 0,
        scoredResponseCount: 0,
        correctResponseCount: 0,
        percentage: null
      },
      postTest: {
        submittedLearnerCount: 0,
        scoredResponseCount: 0,
        correctResponseCount: 0,
        percentage: null
      },
      learningGain: null
    };
    expect(() => TopicComparisonSchema.parse(data)).not.toThrow();
  });

  it("fails on malformed topic comparison", () => {
    const data = {
      topicId: "invalid-uuid",
      topicName: "Airway"
    };
    expect(() => TopicComparisonSchema.parse(data)).toThrow();
  });
});
