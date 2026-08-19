/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { useCohorts } from "../../operations/hooks/use-operations";
import {
  useCohortAggregateComparison,
  useCohortLearnerComparison,
  useCohortTopicComparison,
} from "../hooks/use-quiz-analytics";
import { AdminCohortAnalyticsPage } from "./cohort-analytics-page";

// Mock the hooks
vi.mock("../../operations/hooks/use-operations", () => ({
  useCohorts: vi.fn(),
}));
vi.mock("../hooks/use-quiz-analytics", () => ({
  useCohortAggregateComparison: vi.fn(),
  useCohortLearnerComparison: vi.fn(),
  useCohortTopicComparison: vi.fn(),
}));

const mockCohorts = [
  { id: "cohort-1", name: "Cohort 1", code: "C1", status: "active" },
  { id: "cohort-2", name: "Cohort 2", code: "C2", status: "completed" },
];

const mockAggregate = {
  totalLearners: 10,
  pairedResultCount: 8,
  preTest: {
    averageScorePercent: 40,
    medianScorePercent: 45,
    completionCount: 9,
  },
  postTest: {
    averageScorePercent: 85,
    medianScorePercent: 90,
    completionCount: 8,
    passedCount: 7,
  },
  averageLearningGain: 45,
};

const mockTopics = [
  {
    topicId: "t1",
    topicName: "CPR",
    preTest: { submittedLearnerCount: 9, scoredResponseCount: 18, correctResponseCount: 9, percentage: 50 },
    postTest: { submittedLearnerCount: 8, scoredResponseCount: 16, correctResponseCount: 16, percentage: 100 },
    learningGain: 50,
  },
  {
    topicId: "t2",
    topicName: "AED",
    preTest: { submittedLearnerCount: 9, scoredResponseCount: 9, correctResponseCount: 0, percentage: null }, // testing null
    postTest: { submittedLearnerCount: 0, scoredResponseCount: 0, correctResponseCount: 0, percentage: null }, // testing null
    learningGain: null,
  }
];

const mockLearners = [
  {
    learnerId: "u1",
    learnerName: "Alice",
    preTest: { attemptId: "pre-1", scorePercent: 40, submittedAt: "2023-01-01" },
    postTest: { attemptId: "post-1", scorePercent: 90, submittedAt: "2023-01-02" },
    learningGain: 50,
  },
  {
    learnerId: "u2",
    learnerName: "Bob",
    preTest: { attemptId: "pre-2", scorePercent: 60, submittedAt: "2023-01-01" },
    postTest: { attemptId: null, scorePercent: null, submittedAt: null },
    learningGain: null,
  }
];

function setup(initialRoute = "/analytics") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/analytics" element={<AdminCohortAnalyticsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminCohortAnalyticsPage", () => {
  it("renders cohort selector and empty state when no cohort is selected", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortAggregateComparison).mockReturnValue({ isPending: false, data: null } as any);
    vi.mocked(useCohortTopicComparison).mockReturnValue({ isPending: false, data: null } as any);
    vi.mocked(useCohortLearnerComparison).mockReturnValue({ isPending: false, data: null } as any);

    setup();
    expect(screen.getByLabelText(/select cohort/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a cohort to view analytics/i)).toBeInTheDocument();
    
    // completed cohort is available in selector
    expect(screen.getByRole("option", { name: "Cohort 2 (C2)" })).toBeInTheDocument();
  });

  it("renders summary metrics properly", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortAggregateComparison).mockReturnValue({ isPending: false, data: mockAggregate } as any);
    vi.mocked(useCohortTopicComparison).mockReturnValue({ isPending: false, data: mockTopics } as any);
    vi.mocked(useCohortLearnerComparison).mockReturnValue({ isPending: false, data: mockLearners } as any);

    setup("/analytics?cohort=cohort-1");

    // Summary metrics
    expect(screen.getByText("10")).toBeInTheDocument(); // total learners
    expect(screen.getByText(/90% completion/i)).toBeInTheDocument(); // post-test completion count string 9/10? No wait, 9/10 = 90%. Actually 9 completion / 10 = 90% pre-test
    expect(screen.getByText(/80% completion/i)).toBeInTheDocument(); // post-test 8/10
    expect(screen.getByText(/88% pass rate/i)).toBeInTheDocument(); // passed 7/8 = 87.5 => 88%
    expect(screen.getAllByText("8").length).toBeGreaterThan(0); // paired
  });

  it("renders positive and negative learning gains accurately", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortAggregateComparison).mockReturnValue({ isPending: false, data: { ...mockAggregate, averageLearningGain: -5 } } as any);
    vi.mocked(useCohortTopicComparison).mockReturnValue({ isPending: false, data: mockTopics } as any);
    vi.mocked(useCohortLearnerComparison).mockReturnValue({ isPending: false, data: mockLearners } as any);

    setup("/analytics?cohort=cohort-1");

    // Negative gain displays -5
    expect(screen.getByText("-5")).toBeInTheDocument();
    expect(screen.getByText("percentage points")).toBeInTheDocument();
  });

  it("handles missing data gracefully", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortAggregateComparison).mockReturnValue({
      isPending: false,
      data: {
        totalLearners: 1,
        pairedResultCount: 0,
        preTest: { averageScorePercent: null, medianScorePercent: null, completionCount: 0 },
        postTest: { averageScorePercent: null, medianScorePercent: null, completionCount: 0, passedCount: 0 },
        averageLearningGain: null,
      }
    } as any);
    vi.mocked(useCohortTopicComparison).mockReturnValue({ isPending: false, data: [] } as any);
    vi.mocked(useCohortLearnerComparison).mockReturnValue({ isPending: false, data: [] } as any);

    setup("/analytics?cohort=cohort-1");
    // "No learners have submitted any assessments yet"
    expect(screen.getByText(/No learners have submitted any assessments yet/i)).toBeInTheDocument();
  });

  it("displays learner comparison properly", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortAggregateComparison).mockReturnValue({ isPending: false, data: mockAggregate } as any);
    vi.mocked(useCohortTopicComparison).mockReturnValue({ isPending: false, data: mockTopics } as any);
    vi.mocked(useCohortLearnerComparison).mockReturnValue({ isPending: false, data: mockLearners } as any);

    setup("/analytics?cohort=cohort-1");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    // Bob has no post-test
    expect(screen.getByText("Not submitted")).toBeInTheDocument();
    // Bob has gain unavailable (represented by "—")
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });
});
