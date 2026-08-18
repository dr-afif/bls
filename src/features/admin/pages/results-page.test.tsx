import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminResultsPage } from "./results-page";

const mockUseCohorts = vi.fn();
const mockUseAdminQuizResults = vi.fn();

vi.mock("../../operations/hooks/use-operations", () => ({
  useCohorts: () => mockUseCohorts(),
}));

vi.mock("../../quiz-admin/hooks/use-quiz-staff", () => ({
  useAdminQuizResults: (id: string) => mockUseAdminQuizResults(id),
}));

describe("AdminResultsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCohorts.mockReturnValue({ isPending: false, isError: false, data: [] });
    mockUseAdminQuizResults.mockReturnValue({ isPending: false, isError: false, data: [] });
  });

  it("prompts the user to select a cohort initially", () => {
    render(<MemoryRouter><AdminResultsPage /></MemoryRouter>);
    expect(screen.getByText(/Please select a cohort to view results/i)).toBeVisible();
  });

  it("renders a list of cohorts in the dropdown and displays results", async () => {
    const user = userEvent.setup();
    mockUseCohorts.mockReturnValue({
      isPending: false,
      isError: false,
      data: [{ id: "c1", name: "Cohort 1", code: "C1", status: "active" }],
    });
    mockUseAdminQuizResults.mockImplementation((id: string) => {
      if (id === "c1") {
        return {
          isPending: false,
          isError: false,
          data: [{
            attemptId: "a1",
            learnerName: "John Doe",
            quizTitle: "Post-Test",
            quizType: "post_test",
            status: "submitted",
            scorePercent: 80,
            passed: true,
          }],
        };
      }
      return { isPending: false, isError: false, data: [] };
    });

    render(<MemoryRouter><AdminResultsPage /></MemoryRouter>);
    const select = screen.getByRole("combobox", { name: /select cohort/i });
    await user.selectOptions(select, "c1");

    expect(await screen.findByText("John Doe")).toBeVisible();
    expect(screen.getByText("Post-Test")).toBeVisible();
    expect(screen.getByText("80% (Pass)")).toBeVisible();
  });
});
