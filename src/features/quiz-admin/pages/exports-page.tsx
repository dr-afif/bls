import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileDown, Loader2, ShieldAlert } from "lucide-react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { ResultsNavigation } from "../../admin/components/results-navigation";
import { useCohorts } from "../../operations/hooks/use-operations";
import {
  useAssessmentResultsExport,
  useCohortRosterExport,
  usePrePostComparisonExport,
} from "../hooks/use-export";
import {
  buildExportFilename,
  downloadCsv,
  generateCsv,
  type CsvColumn,
} from "../../../utils/csv-serializer";
import type {
  AssessmentResultsExportRow,
  PrePostComparisonExportRow,
  QuizType,
  RosterExportRow,
} from "../data/export-repository";

const ROSTER_COLUMNS: CsvColumn<RosterExportRow>[] = [
  { key: "cohortCode", header: "Cohort Code" },
  { key: "cohortName", header: "Cohort Name" },
  { key: "learnerName", header: "Learner Name" },
  { key: "membershipStatus", header: "Membership Status" },
];

const ASSESSMENT_COLUMNS: CsvColumn<AssessmentResultsExportRow>[] = [
  { key: "cohortCode", header: "Cohort Code" },
  { key: "cohortName", header: "Cohort Name" },
  { key: "learnerName", header: "Learner Name" },
  { key: "assessmentType", header: "Assessment Type" },
  { key: "quizTitle", header: "Quiz Title" },
  { key: "quizVersionNumber", header: "Quiz Version Number" },
  { key: "status", header: "Status" },
  { key: "submittedAt", header: "Submitted At" },
  { key: "scorePercent", header: "Score Percent" },
  {
    key: "passed",
    header: "Passed",
    getValue: (r) => (r.passed === null ? "" : r.passed ? "true" : "false"),
  },
];

const PRE_POST_COLUMNS: CsvColumn<PrePostComparisonExportRow>[] = [
  { key: "cohortCode", header: "Cohort Code" },
  { key: "cohortName", header: "Cohort Name" },
  { key: "learnerName", header: "Learner Name" },
  { key: "preTestStatus", header: "Pre-Test Status" },
  { key: "preTestSubmittedAt", header: "Pre-Test Submitted At" },
  { key: "preTestScorePercent", header: "Pre-Test Score Percent" },
  { key: "postTestStatus", header: "Post-Test Status" },
  { key: "postTestSubmittedAt", header: "Post-Test Submitted At" },
  { key: "postTestScorePercent", header: "Post-Test Score Percent" },
  {
    key: "postTestPassed",
    header: "Post-Test Passed",
    getValue: (r) =>
      r.postTestPassed === null ? "" : r.postTestPassed ? "true" : "false",
  },
  {
    key: "learningGainPercentagePoints",
    header: "Learning Gain (Percentage Points)",
  },
];

export function AdminExportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCohortId = searchParams.get("cohort") || "";
  const [assessmentType, setAssessmentType] = useState<QuizType>("pre_test");
  const [statusFeedback, setStatusFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const cohortsQuery = useCohorts();
  const cohorts = cohortsQuery.data ?? [];
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId);
  const cohortCode = selectedCohort?.code || selectedCohort?.name || "cohort";

  const rosterMutation = useCohortRosterExport();
  const assessmentMutation = useAssessmentResultsExport();
  const prePostMutation = usePrePostComparisonExport();

  const isExporting =
    rosterMutation.isPending ||
    assessmentMutation.isPending ||
    prePostMutation.isPending;

  const handleDownloadRoster = async () => {
    if (!selectedCohortId || isExporting) return;
    setStatusFeedback(null);
    try {
      const requestId = crypto.randomUUID();
      const rows = await rosterMutation.mutateAsync({
        cohortId: selectedCohortId,
        requestId,
      });
      const csv = generateCsv(rows, ROSTER_COLUMNS);
      const filename = buildExportFilename(cohortCode, "roster");
      downloadCsv(csv, filename);
      setStatusFeedback({ type: "success", message: "Export generated" });
    } catch (err) {
      setStatusFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to generate export",
      });
    }
  };

  const handleDownloadAssessment = async () => {
    if (!selectedCohortId || isExporting) return;
    setStatusFeedback(null);
    try {
      const requestId = crypto.randomUUID();
      const rows = await assessmentMutation.mutateAsync({
        cohortId: selectedCohortId,
        quizType: assessmentType,
        requestId,
      });
      const csv = generateCsv(rows, ASSESSMENT_COLUMNS);
      const filename = buildExportFilename(
        cohortCode,
        assessmentType === "pre_test" ? "pre-test-results" : "post-test-results"
      );
      downloadCsv(csv, filename);
      setStatusFeedback({ type: "success", message: "Export generated" });
    } catch (err) {
      setStatusFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to generate export",
      });
    }
  };

  const handleDownloadComparison = async () => {
    if (!selectedCohortId || isExporting) return;
    setStatusFeedback(null);
    try {
      const requestId = crypto.randomUUID();
      const rows = await prePostMutation.mutateAsync({
        cohortId: selectedCohortId,
        requestId,
      });
      const csv = generateCsv(rows, PRE_POST_COLUMNS);
      const filename = buildExportFilename(cohortCode, "pre-post-comparison");
      downloadCsv(csv, filename);
      setStatusFeedback({ type: "success", message: "Export generated" });
    } catch (err) {
      setStatusFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to generate export",
      });
    }
  };

  if (cohortsQuery.isPending) return <StatePanel kind="loading" />;
  if (cohortsQuery.isError) return <StatePanel kind="error" />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Securely download cohort data as CSV files."
        eyebrow="Administration"
        title="Exports"
      />

      <ResultsNavigation />

      {/* Privacy Notice Banner */}
      <div
        aria-live="polite"
        className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p>
          Exports may contain learner-identifiable information. Store and share
          downloaded files according to your organization&apos;s data-handling
          requirements.
        </p>
      </div>

      {/* Status Feedback */}
      {statusFeedback && (
        <div
          role={statusFeedback.type === "error" ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm font-medium ${
            statusFeedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40"
          }`}
        >
          {statusFeedback.message}
        </div>
      )}

      {/* Cohort Selector */}
      <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:gap-4">
        <label
          className="text-sm font-semibold shrink-0"
          htmlFor="cohort-select"
        >
          Select cohort:
        </label>
        <select
          className="max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          id="cohort-select"
          onChange={(e) => {
            const val = e.target.value;
            setStatusFeedback(null);
            setSearchParams((prev) => {
              const p = new URLSearchParams(prev);
              if (val) p.set("cohort", val);
              else p.delete("cohort");
              return p;
            });
          }}
          value={selectedCohortId}
        >
          <option value="">-- Choose a cohort --</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* When no cohort selected */}
      {!selectedCohortId && (
        <StatePanel
          kind="empty"
          title="No cohort selected"
          description="Choose a cohort above to access available CSV exports."
        />
      )}

      {/* When cohort selected */}
      {selectedCohortId && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Cohort Roster */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Cohort Roster</CardTitle>
              </div>
              <CardDescription>
                Export the list of enrolled learners along with membership status.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full"
                disabled={isExporting}
                onClick={handleDownloadRoster}
                variant="outline"
              >
                {rosterMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download roster CSV
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Assessment Results */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Assessment Results</CardTitle>
              </div>
              <CardDescription>
                Export latest authoritative assessment scores, versions, and pass/fail statuses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold text-muted-foreground"
                  htmlFor="assessment-select"
                >
                  Assessment:
                </label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  id="assessment-select"
                  onChange={(e) =>
                    setAssessmentType(e.target.value as QuizType)
                  }
                  value={assessmentType}
                >
                  <option value="pre_test">Pre-test</option>
                  <option value="post_test">Post-test</option>
                </select>
              </div>
              <Button
                className="w-full"
                disabled={isExporting}
                onClick={handleDownloadAssessment}
                variant="outline"
              >
                {assessmentMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download results CSV
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Pre/Post Comparison */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Pre/Post Comparison</CardTitle>
              </div>
              <CardDescription>
                Export combined pre-test and post-test scores with percentage-point learning gains.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                className="w-full"
                disabled={isExporting}
                onClick={handleDownloadComparison}
                variant="outline"
              >
                {prePostMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download comparison CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
