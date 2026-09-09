/* eslint-disable @typescript-eslint/no-explicit-any */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCohorts } from "../../operations/hooks/use-operations";
import {
  useAssessmentResultsExport,
  useCohortRosterExport,
  usePrePostComparisonExport,
} from "../hooks/use-export";
import * as csvSerializer from "../../../utils/csv-serializer";
import { AdminExportsPage } from "./exports-page";

vi.mock("../../operations/hooks/use-operations", () => ({
  useCohorts: vi.fn(),
}));

vi.mock("../hooks/use-export", () => ({
  useCohortRosterExport: vi.fn(),
  useAssessmentResultsExport: vi.fn(),
  usePrePostComparisonExport: vi.fn(),
}));

const mockCohorts = [
  { id: "cohort-1", name: "Cohort Alpha", code: "BLS-ALPHA", status: "active" },
  { id: "cohort-2", name: "Cohort Beta (Historic)", code: "BLS-BETA", status: "completed" },
];

function setup(initialRoute = "/app/admin/results/exports") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/app/admin/results/exports" element={<AdminExportsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminExportsPage", () => {
  let mockRosterMutate: ReturnType<typeof vi.fn>;
  let mockAssessmentMutate: ReturnType<typeof vi.fn>;
  let mockPrePostMutate: ReturnType<typeof vi.fn>;
  let mockDownloadCsv: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRosterMutate = vi.fn().mockResolvedValue([
      {
        cohortCode: "BLS-ALPHA",
        cohortName: "Cohort Alpha",
        learnerName: "Amina Rahman",
        membershipStatus: "active",
      },
    ]);

    mockAssessmentMutate = vi.fn().mockResolvedValue([
      {
        cohortCode: "BLS-ALPHA",
        cohortName: "Cohort Alpha",
        learnerName: "Amina Rahman",
        assessmentType: "pre_test",
        quizTitle: "Pre Test",
        quizVersionNumber: 1,
        status: "submitted",
        submittedAt: "2026-08-19T09:00:00Z",
        scorePercent: 90,
        passed: true,
      },
    ]);

    mockPrePostMutate = vi.fn().mockResolvedValue([
      {
        cohortCode: "BLS-ALPHA",
        cohortName: "Cohort Alpha",
        learnerName: "Amina Rahman",
        preTestStatus: "submitted",
        preTestSubmittedAt: "2026-08-19T09:00:00Z",
        preTestScorePercent: 70,
        postTestStatus: "submitted",
        postTestSubmittedAt: "2026-08-19T17:00:00Z",
        postTestScorePercent: 90,
        postTestPassed: true,
        learningGainPercentagePoints: 20,
      },
    ]);

    vi.mocked(useCohorts).mockReturnValue({
      data: mockCohorts,
      isPending: false,
      isError: false,
    } as any);

    vi.mocked(useCohortRosterExport).mockReturnValue({
      mutateAsync: mockRosterMutate,
      isPending: false,
    } as any);

    vi.mocked(useAssessmentResultsExport).mockReturnValue({
      mutateAsync: mockAssessmentMutate,
      isPending: false,
    } as any);

    vi.mocked(usePrePostComparisonExport).mockReturnValue({
      mutateAsync: mockPrePostMutate,
      isPending: false,
    } as any);

    mockDownloadCsv = vi.spyOn(csvSerializer, "downloadCsv").mockImplementation(() => {});
  });

  it("renders page header, navigation, and privacy notice", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Exports" })).toBeInTheDocument();
    expect(
      screen.getByText(/Exports may contain learner-identifiable information/i)
    ).toBeInTheDocument();
  });

  it("shows empty state when no cohort is selected", () => {
    setup();
    expect(screen.getByText("No cohort selected")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Download roster CSV" })
    ).not.toBeInTheDocument();
  });

  it("initializes from URL parameter and includes completed/historical cohorts in selector", () => {
    setup("/app/admin/results/exports?cohort=cohort-2");
    const select = screen.getByLabelText("Select cohort:") as HTMLSelectElement;
    expect(select.value).toBe("cohort-2");
    expect(screen.getByRole("button", { name: "Download roster CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download results CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download comparison CSV" })).toBeInTheDocument();
  });

  it("executes roster export with expected filename on deliberate button click", async () => {
    setup("/app/admin/results/exports?cohort=cohort-1");
    const rosterBtn = screen.getByRole("button", { name: "Download roster CSV" });

    fireEvent.click(rosterBtn);

    await waitFor(() => {
      expect(mockRosterMutate).toHaveBeenCalledWith(
        expect.objectContaining({ cohortId: "cohort-1" })
      );
      expect(mockDownloadCsv).toHaveBeenCalledWith(
        expect.stringContaining("Cohort Code,Cohort Name,Learner Name"),
        expect.stringMatching(/^bls_BLS-ALPHA_roster_\d{4}-\d{2}-\d{2}\.csv$/)
      );
      expect(screen.getByRole("status")).toHaveTextContent("Export generated");
    });
  });

  it("executes assessment export with selected quiz type (pre-test and post-test)", async () => {
    setup("/app/admin/results/exports?cohort=cohort-1");
    const assessmentSelect = screen.getByLabelText("Assessment:") as HTMLSelectElement;
    expect(assessmentSelect.value).toBe("pre_test");

    const resultsBtn = screen.getByRole("button", { name: "Download results CSV" });
    fireEvent.click(resultsBtn);

    await waitFor(() => {
      expect(mockAssessmentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ cohortId: "cohort-1", quizType: "pre_test" })
      );
      expect(mockDownloadCsv).toHaveBeenCalledWith(
        expect.stringContaining("Assessment Type,Quiz Title"),
        expect.stringMatching(/^bls_BLS-ALPHA_pre-test-results_\d{4}-\d{2}-\d{2}\.csv$/)
      );
    });

    // Switch to post-test
    fireEvent.change(assessmentSelect, { target: { value: "post_test" } });
    expect(assessmentSelect.value).toBe("post_test");

    fireEvent.click(resultsBtn);

    await waitFor(() => {
      expect(mockAssessmentMutate).toHaveBeenCalledWith(
        expect.objectContaining({ cohortId: "cohort-1", quizType: "post_test" })
      );
      expect(mockDownloadCsv).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/^bls_BLS-ALPHA_post-test-results_\d{4}-\d{2}-\d{2}\.csv$/)
      );
    });
  });

  it("executes pre/post comparison export with expected filename", async () => {
    setup("/app/admin/results/exports?cohort=cohort-1");
    const compBtn = screen.getByRole("button", { name: "Download comparison CSV" });

    fireEvent.click(compBtn);

    await waitFor(() => {
      expect(mockPrePostMutate).toHaveBeenCalledWith(
        expect.objectContaining({ cohortId: "cohort-1" })
      );
      expect(mockDownloadCsv).toHaveBeenCalledWith(
        expect.stringContaining("Learning Gain (Percentage Points)"),
        expect.stringMatching(/^bls_BLS-ALPHA_pre-post-comparison_\d{4}-\d{2}-\d{2}\.csv$/)
      );
      expect(screen.getByRole("status")).toHaveTextContent("Export generated");
    });
  });

  it("displays accessible error message when export mutation fails", async () => {
    mockRosterMutate.mockRejectedValueOnce(new Error("Network connection dropped"));
    setup("/app/admin/results/exports?cohort=cohort-1");

    fireEvent.click(screen.getByRole("button", { name: "Download roster CSV" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network connection dropped");
    });
  });

  it("disables buttons while export is pending to prevent duplicate clicks", () => {
    vi.mocked(useCohortRosterExport).mockReturnValue({
      mutateAsync: mockRosterMutate,
      isPending: true,
    } as any);

    setup("/app/admin/results/exports?cohort=cohort-1");

    expect(screen.getByRole("button", { name: /Download roster CSV/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download results CSV/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download comparison CSV/i })).toBeDisabled();
  });
});
