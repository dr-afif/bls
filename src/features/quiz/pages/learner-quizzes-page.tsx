import { ArrowRight, CheckCircle2, Clock3, FileQuestion, LockKeyhole, Unlock, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useAvailableQuizzes, useStartQuizAttempt } from "../hooks/use-quiz";

export function LearnerQuizzesPage() {
  const { data: quizzes, status } = useAvailableQuizzes();
  const startAttempt = useStartQuizAttempt();
  const navigate = useNavigate();

  if (status === "pending") return <StatePanel kind="loading" />;
  if (status === "error") return <StatePanel kind="error" />;

  const preTest = quizzes?.find((q) => q.type === "pre_test");
  const postTest = quizzes?.find((q) => q.type === "post_test");

  const handleStart = (quizId: string) => {
    startAttempt.mutate(
      { quizId, requestId: crypto.randomUUID() },
      {
        onSuccess: (attempt) => {
          if (attempt.status === "in_progress") {
            navigate(`/app/learner/quiz/${quizId}/attempt/${attempt.attemptId}`);
          }
        },
      }
    );
  };

  return (
    <div className="space-y-7">
      <PageHeader
        description="Check assessment availability and review permitted result summaries."
        eyebrow="Course assessments"
        title="Quiz"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {preTest && (
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Before course</p>
                  <CardTitle className="mt-1">{preTest.title}</CardTitle>
                </div>
                {preTest.attemptsUsed > 0 ? (
                  <Badge variant="success">
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="info">
                    <Unlock aria-hidden="true" className="size-3.5" />
                    Available
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4" />
                  {preTest.timeLimitMinutes} minutes
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileQuestion aria-hidden="true" className="size-4" />
                  Limit: {preTest.attemptLimit} attempt{preTest.attemptLimit !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-4 text-sm">{preTest.instructions}</p>
              
              {preTest.attemptsUsed > 0 ? (
                <Button asChild className="mt-5">
                  <Link to={`/app/learner/quiz/${preTest.quizId}/result`}>
                    View score and topics
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  className="mt-5" 
                  disabled={!preTest.released || startAttempt.isPending} 
                  onClick={() => handleStart(preTest.quizId)}
                >
                  {startAttempt.isPending && startAttempt.variables?.quizId === preTest.quizId ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    "Start pre-test"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {postTest && (
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">After course</p>
                  <CardTitle className="mt-1">{postTest.title}</CardTitle>
                </div>
                {postTest.attemptsUsed > 0 ? (
                  <Badge variant="success">
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    Completed
                  </Badge>
                ) : postTest.released ? (
                  <Badge variant="info">
                    <Unlock aria-hidden="true" className="size-3.5" />
                    Released
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                    Not released
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Clock3 aria-hidden="true" className="size-4" />
                  {postTest.timeLimitMinutes} minutes
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileQuestion aria-hidden="true" className="size-4" />
                  Limit: {postTest.attemptLimit} attempt{postTest.attemptLimit !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-4 text-sm">
                {!postTest.released ? "A secure production release has not occurred." : postTest.instructions}
              </p>
              
              {postTest.attemptsUsed > 0 ? (
                <Button asChild className="mt-5">
                  <Link to={`/app/learner/quiz/${postTest.quizId}/result`}>
                    View score and topics
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  className="mt-5" 
                  disabled={!postTest.released || startAttempt.isPending} 
                  onClick={() => handleStart(postTest.quizId)}
                >
                  {startAttempt.isPending && startAttempt.variables?.quizId === postTest.quizId ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    "Start post-test"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
