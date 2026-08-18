import { ArrowLeft, BarChart3, Info } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useAvailableQuizzes, useQuizAttemptResult } from "../hooks/use-quiz";
import type { QuizTopicResult } from "../model/quiz-types";

export function LearnerResultPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { data: quizzes, status: quizzesStatus } = useAvailableQuizzes();
  const { data: result, status: resultStatus } = useQuizAttemptResult(quizId!);

  if (quizzesStatus === "pending" || resultStatus === "pending") return <StatePanel kind="loading" />;
  if (resultStatus === "error") return <StatePanel kind="error" />;
  if (!result) return <StatePanel kind="error" />; // Should not happen if they arrived here legitimately

  const quiz = quizzes?.find((q) => q.quizId === quizId);
  const title = quiz?.title || "Quiz Result";
  
  // Format the date if it exists
  const completedDate = result.submitted_at 
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.submitted_at))
    : "Completed recently";

  return (
    <div className="space-y-7">
      <Button asChild variant="ghost">
        <Link to="/app/learner/quiz">
          <ArrowLeft aria-hidden="true" />
          Back to Quiz
        </Link>
      </Button>

      <PageHeader
        description={`Submitted on ${completedDate}.`}
        eyebrow="Personal result"
        title={title}
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <Card className="shadow-none">
          <CardContent className="flex min-h-56 flex-col items-center justify-center pt-5 text-center sm:pt-6">
            <BarChart3 aria-hidden="true" className="size-7 text-accent" />
            <p className="mt-3 text-5xl font-bold tabular-nums">
              {result.score_percent != null ? `${result.score_percent}%` : "--"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Overall score</p>
            <Badge className="mt-4" variant={result.passed ? "success" : "warning"}>
              {result.passed ? "Passed" : "Did not pass"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Topic-level summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Array.isArray(result.topic_summary) && result.topic_summary.length > 0 ? (
                (result.topic_summary as unknown as QuizTopicResult[]).map((topic, idx) => (
                  <div key={idx}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="font-semibold">Topic {idx + 1}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {topic.percent}%
                      </span>
                    </div>
                    <div
                      aria-label={`Topic ${idx + 1}: ${topic.percent}%`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={topic.percent}
                      className="h-2.5 overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${topic.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No topic summary available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 rounded-xl border border-info/20 bg-info-soft p-4 text-info">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">Review policy applies</h2>
          <p className="mt-1 text-sm">
            Individual questions, correct answers and explanations are not
            shown. A future production review policy will control that detail.
          </p>
        </div>
      </div>
    </div>
  );
}
