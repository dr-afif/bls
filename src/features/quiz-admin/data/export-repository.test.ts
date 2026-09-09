import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import type { Database } from "../../../lib/supabase/database.types";
import {
  AssessmentResultsExportRowSchema,
  PrePostComparisonExportRowSchema,
  RosterExportRowSchema,
  exportRepository,
} from "./export-repository";

function createMockClient(mockData: unknown, mockError: unknown = null) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: mockData,
      error: mockError,
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("exportRepository", () => {
  describe("getCohortRoster", () => {
    it("parses valid roster payload", async () => {
      const payload = [
        {
          cohortCode: "BLS-01",
          cohortName: "Morning Batch",
          learnerName: "Amina Rahman",
          membershipStatus: "active",
        },
      ];
      const client = createMockClient(payload);
      const res = await exportRepository.getCohortRoster(
        client,
        "cohort-uuid",
        "req-uuid"
      );
      expect(res).toHaveLength(1);
      expect(res[0].learnerName).toBe("Amina Rahman");
      expect(res[0].cohortName).toBe("Morning Batch");
    });

    it("parses valid roster payload with legitimate nulls", async () => {
      const payload = [
        {
          cohortCode: "BLS-01",
          cohortName: null,
          learnerName: "John Doe",
          membershipStatus: "completed",
        },
      ];
      const client = createMockClient(payload);
      const res = await exportRepository.getCohortRoster(
        client,
        "cohort-uuid",
        "req-uuid"
      );
      expect(res[0].cohortName).toBeNull();
    });

    it("rejects malformed roster payload missing required learnerName", () => {
      expect(() =>
        RosterExportRowSchema.parse({
          cohortCode: "BLS-01",
          cohortName: null,
          membershipStatus: "active",
        })
      ).toThrow();
    });

    it("propagates RPC errors", async () => {
      const client = createMockClient(null, new Error("RPC error"));
      await expect(
        exportRepository.getCohortRoster(client, "cohort-uuid", "req-uuid")
      ).rejects.toThrow("RPC error");
    });
  });

  describe("getAssessmentResults", () => {
    it("parses valid assessment results payload", async () => {
      const payload = [
        {
          cohortCode: "BLS-01",
          cohortName: "Test Cohort",
          learnerName: "Sara Lim",
          assessmentType: "pre_test",
          quizTitle: "BLS Pre-Test",
          quizVersionNumber: 1,
          status: "submitted",
          submittedAt: "2026-08-19T10:00:00Z",
          scorePercent: 85,
          passed: true,
        },
      ];
      const client = createMockClient(payload);
      const res = await exportRepository.getAssessmentResults(
        client,
        "cohort-uuid",
        "pre_test",
        "req-uuid"
      );
      expect(res).toHaveLength(1);
      expect(res[0].scorePercent).toBe(85);
      expect(res[0].passed).toBe(true);
    });

    it("parses unsubmitted learner results with legitimate null values", async () => {
      const payload = [
        {
          cohortCode: "BLS-01",
          cohortName: null,
          learnerName: "Unsubmitted Learner",
          assessmentType: "post_test",
          quizTitle: "BLS Post-Test",
          quizVersionNumber: null,
          status: "not_submitted",
          submittedAt: null,
          scorePercent: null,
          passed: null,
        },
      ];
      const client = createMockClient(payload);
      const res = await exportRepository.getAssessmentResults(
        client,
        "cohort-uuid",
        "post_test",
        "req-uuid"
      );
      expect(res[0].status).toBe("not_submitted");
      expect(res[0].scorePercent).toBeNull();
      expect(res[0].passed).toBeNull();
    });

    it("rejects malformed score percent type", () => {
      expect(() =>
        AssessmentResultsExportRowSchema.parse({
          cohortCode: "BLS-01",
          cohortName: null,
          learnerName: "Learner",
          assessmentType: "pre_test",
          quizTitle: "Title",
          quizVersionNumber: 1,
          status: "submitted",
          submittedAt: "2026-08-19T10:00:00Z",
          scorePercent: "not-a-number",
          passed: true,
        })
      ).toThrow();
    });

    it("propagates RPC errors", async () => {
      const client = createMockClient(null, new Error("Database timeout"));
      await expect(
        exportRepository.getAssessmentResults(
          client,
          "cohort-uuid",
          "pre_test",
          "req-uuid"
        )
      ).rejects.toThrow("Database timeout");
    });
  });

  describe("getPrePostComparison", () => {
    it("parses valid pre/post comparison with positive learning gain", async () => {
      const payload = [
        {
          cohortCode: "BLS-01",
          cohortName: "Batch 1",
          learnerName: "Daniel Wong",
          preTestStatus: "submitted",
          preTestSubmittedAt: "2026-08-19T09:00:00Z",
          preTestScorePercent: 60,
          postTestStatus: "submitted",
          postTestSubmittedAt: "2026-08-19T17:00:00Z",
          postTestScorePercent: 90,
          postTestPassed: true,
          learningGainPercentagePoints: 30,
        },
      ];
      const client = createMockClient(payload);
      const res = await exportRepository.getPrePostComparison(
        client,
        "cohort-uuid",
        "req-uuid"
      );
      expect(res).toHaveLength(1);
      expect(res[0].learningGainPercentagePoints).toBe(30);
    });

    it("parses negative learning gain correctly", () => {
      const parsed = PrePostComparisonExportRowSchema.parse({
        cohortCode: "BLS-01",
        cohortName: "Batch 1",
        learnerName: "Daniel Wong",
        learnerEmail: null,
        preTestStatus: "submitted",
        preTestSubmittedAt: "2026-08-19T09:00:00Z",
        preTestScorePercent: 80,
        postTestStatus: "submitted",
        postTestSubmittedAt: "2026-08-19T17:00:00Z",
        postTestScorePercent: 70,
        postTestPassed: false,
        learningGainPercentagePoints: -10,
      });
      expect(parsed.learningGainPercentagePoints).toBe(-10);
    });

    it("handles unpaired null learning gain correctly", () => {
      const parsed = PrePostComparisonExportRowSchema.parse({
        cohortCode: "BLS-01",
        cohortName: null,
        learnerName: "Unpaired Learner",
        learnerEmail: null,
        preTestStatus: "submitted",
        preTestSubmittedAt: "2026-08-19T09:00:00Z",
        preTestScorePercent: 60,
        postTestStatus: "not_submitted",
        postTestSubmittedAt: null,
        postTestScorePercent: null,
        postTestPassed: null,
        learningGainPercentagePoints: null,
      });
      expect(parsed.learningGainPercentagePoints).toBeNull();
    });

    it("propagates RPC errors", async () => {
      const client = createMockClient(null, new Error("Access denied"));
      await expect(
        exportRepository.getPrePostComparison(client, "cohort-uuid", "req-uuid")
      ).rejects.toThrow("Access denied");
    });
  });
});
