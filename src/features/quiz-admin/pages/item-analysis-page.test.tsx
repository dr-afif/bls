/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { useCohorts } from "../../operations/hooks/use-operations";
import { useCohortItemAnalysis } from "../hooks/use-quiz-analytics";
import { AdminItemAnalysisPage } from "./item-analysis-page";

// Mock the hooks
vi.mock("../../operations/hooks/use-operations", () => ({
  useCohorts: vi.fn(),
}));
vi.mock("../hooks/use-quiz-analytics", () => ({
  useCohortItemAnalysis: vi.fn(),
}));

const mockCohorts = [
  { id: "cohort-1", name: "Cohort 1", code: "C1", status: "active" },
  { id: "cohort-2", name: "Cohort 2", code: "C2", status: "completed" },
];

const mockAnalysis = {
  cohortId: "cohort-1",
  assessmentType: "pre_test",
  analyzedLearnerCount: 5,
  items: [
    {
      questionVersionId: "v1",
      questionVersionNumber: 1,
      prompt: "What is the recommended compression depth for adults?",
      topicName: "CPR",
      responseCount: 5,
      correctResponseCount: 4,
      correctResponseRate: 80,
      options: [
        {
          questionOptionId: "o1",
          optionText: "At least 2 inches",
          isCorrect: true,
          selectedCount: 4,
          selectionPercent: 80,
        },
        {
          questionOptionId: "o2",
          optionText: "About 1 inch",
          isCorrect: false,
          selectedCount: 1,
          selectionPercent: 20,
        },
      ],
    },
  ],
};

function setup(initialRoute = "/item-analysis") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/item-analysis" element={<AdminItemAnalysisPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminItemAnalysisPage", () => {
  it("renders cohort selector and empty state when no cohort is selected", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortItemAnalysis).mockReturnValue({ isPending: false, data: null } as any);

    setup();
    expect(screen.getByLabelText(/select cohort/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a cohort to view item analysis/i)).toBeInTheDocument();
    
    // completed cohort is available in selector
    expect(screen.getByRole("option", { name: "Cohort 2 (C2)" })).toBeInTheDocument();
  });

  it("handles empty submission case", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortItemAnalysis).mockReturnValue({
      isPending: false,
      data: {
        cohortId: "cohort-1",
        assessmentType: "pre_test",
        analyzedLearnerCount: 0,
        items: []
      }
    } as any);

    setup("/item-analysis?cohort=cohort-1&assessment=pre_test");
    
    expect(screen.getByText(/no submitted attempts found for this assessment/i)).toBeInTheDocument();
  });

  it("renders item analysis table properly when data is available", () => {
    vi.mocked(useCohorts).mockReturnValue({ isPending: false, isError: false, data: mockCohorts } as any);
    vi.mocked(useCohortItemAnalysis).mockReturnValue({ isPending: false, data: mockAnalysis } as any);

    setup("/item-analysis?cohort=cohort-1&assessment=pre_test");

    // Context banner
    expect(screen.getByText(/based on the latest submitted attempt for 5 learners/i)).toBeInTheDocument();

    // Table data
    expect(screen.getByText("What is the recommended compression depth for adults?")).toBeInTheDocument();
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0); // Correct percentage for question
    
    // Options
    expect(screen.getByText("At least 2 inches")).toBeInTheDocument();
    expect(screen.getByText("(4)")).toBeInTheDocument(); // Count for o1
    expect(screen.getByText("About 1 inch")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument(); // Count for o2
  });
});
