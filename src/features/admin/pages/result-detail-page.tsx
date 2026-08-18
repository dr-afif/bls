import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { useAdminQuizAttemptDetail } from "../../quiz-admin/hooks/use-quiz-staff";

export function AdminResultDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const attemptDetail = useAdminQuizAttemptDetail(attemptId!);

  if (attemptDetail.isPending) return <StatePanel kind="loading" />;
  if (attemptDetail.isError) return <StatePanel kind="error" />;
  if (!attemptDetail.data) return <StatePanel kind="error" />;

  const data = attemptDetail.data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild size="icon" variant="ghost">
          <Link aria-label="Back to results" to="/app/admin/results">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <PageHeader
          description={`Detailed view for attempt ${data.attemptId}`}
          eyebrow="Attempt Detail"
          title={`${data.learnerName} - ${data.quizTitle}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-1 font-semibold capitalize">{data.status.replace("_", " ")}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Started At</p>
          <p className="mt-1 font-semibold text-sm">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(data.startedAt))}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Submitted At</p>
          <p className="mt-1 font-semibold text-sm">
            {data.submittedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(data.submittedAt)) : "N/A"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Score</p>
          <p className="mt-1 font-bold">
            {data.scorePercent !== undefined ? `${data.scorePercent}%` : "N/A"} 
            {data.passed !== undefined && (
              <span className={data.passed ? "text-success ml-2" : "text-destructive ml-2"}>
                {data.passed ? "(Pass)" : "(Fail)"}
              </span>
            )}
          </p>
        </div>
      </div>

      {data.topicSummary.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Topic Summary</h3>
          <div className="space-y-4">
            {data.topicSummary.map(topic => (
              <div key={topic.topicId}>
                <div className="flex justify-between text-sm mb-1">
                  <span>Topic: {topic.topicId}</span>
                  <span className="font-semibold">{topic.earned} / {topic.possible} pts ({topic.percent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${topic.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="font-semibold text-lg">Question Responses</h3>
        {data.questions.map((question, index) => (
          <div className="rounded-xl border bg-card p-6 space-y-4" key={question.attemptQuestionId}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-muted-foreground">Question {index + 1} • {question.points} {question.points === 1 ? 'pt' : 'pts'}</p>
                <p className="mt-2 font-medium">{question.prompt}</p>
              </div>
              {question.isCorrect !== undefined && (
                <div className="shrink-0 flex items-center gap-1.5 font-medium text-sm">
                  {question.isCorrect ? (
                    <><CheckCircle2 className="size-5 text-success" /> <span className="text-success">{question.pointsAwarded} / {question.points}</span></>
                  ) : (
                    <><XCircle className="size-5 text-destructive" /> <span className="text-destructive">0 / {question.points}</span></>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-2 mt-4">
              {question.options.map((option) => {
                const isSelected = option.id === question.selectedOptionId;
                const isCorrect = option.isCorrect;
                
                let borderClass = "border-border";
                let bgClass = "bg-card";

                if (data.status === "submitted") {
                  if (isSelected && isCorrect) {
                    borderClass = "border-success";
                    bgClass = "bg-success/10";
                  } else if (isSelected && !isCorrect) {
                    borderClass = "border-destructive";
                    bgClass = "bg-destructive/10";
                  } else if (!isSelected && isCorrect) {
                    borderClass = "border-success/50";
                  }
                } else if (isSelected) {
                  borderClass = "border-primary";
                  bgClass = "bg-primary/5";
                }

                return (
                  <div className={`rounded-lg border p-3 flex items-start gap-3 ${borderClass} ${bgClass}`} key={option.id}>
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <div className="size-4 rounded-full border-4 border-primary" />
                      ) : (
                        <div className="size-4 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{option.text}</p>
                    </div>
                    {data.status === "submitted" && (
                      <div className="shrink-0">
                        {isCorrect && <CheckCircle2 className="size-4 text-success" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
