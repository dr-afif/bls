import { AlertCircle, Clock, Loader2, Save } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useQuizAttempt, useSaveQuizAnswer, useSubmitQuizAttempt } from "../hooks/use-quiz";

export function LearnerAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { data: attempt, status } = useQuizAttempt(attemptId!);
  const saveAnswer = useSaveQuizAnswer();
  const submitAttempt = useSubmitQuizAttempt();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeout = useRef<number | undefined>(undefined);

  const getAnswer = (questionId: string, initialSelected: string | null) => {
    return answers[questionId] !== undefined ? answers[questionId] : (initialSelected || "");
  };

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!attempt?.expiresAt) return;
    const expiresAt = new Date(attempt.expiresAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt?.expiresAt]);

  if (status === "pending") return <StatePanel kind="loading" />;
  if (status === "error") return <StatePanel kind="error" />;

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSavingState("saving");
    
    if (saveTimeout.current !== undefined) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      saveAnswer.mutate(
        { attemptQuestionId: questionId, attemptOptionId: optionId },
        {
          onSuccess: () => setSavingState("saved"),
          onError: () => setSavingState("idle"),
        }
      );
    }, 500);
  };

  const handleSubmit = () => {
    submitAttempt.mutate(
      { attemptId: attemptId!, requestId: crypto.randomUUID() },
      {
        onSuccess: () => {
          navigate("/app/learner/quiz", { replace: true });
        },
      }
    );
  };

  const allAnswered = attempt?.questions.every((q) => getAnswer(q.attemptQuestionId, q.selectedOptionId)) || false;

  return (
    <div className="mx-auto max-w-3xl space-y-7 pb-20">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Active Quiz Attempt</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {savingState === "saving" && (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </>
              )}
              {savingState === "saved" && (
                <>
                  <Save className="size-3" />
                  Saved
                </>
              )}
              {savingState === "idle" && (
                <>
                  <Save className="size-3 opacity-50" />
                  No unsaved changes
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-lg font-medium tabular-nums text-primary">
            <Clock className="size-5" />
            {timeLeft || "--:--"}
          </div>
        </div>
      </div>

      {isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-destructive">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Time is up!</h2>
            <p className="mt-1 text-sm">
              Your time for this quiz has expired. Please submit your current answers.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {attempt.questions.map((q, index) => (
          <Card key={q.attemptQuestionId}>
            <CardContent className="pt-6">
              <div className="mb-4 text-sm font-semibold text-muted-foreground">
                Question {index + 1} of {attempt.questions.length}
              </div>
              <p className="mb-6 text-base font-medium leading-relaxed">{q.prompt}</p>
              
              <div role="radiogroup" className="space-y-3">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                      getAnswer(q.attemptQuestionId, q.selectedOptionId) === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.attemptQuestionId}
                      value={opt.id}
                      checked={getAnswer(q.attemptQuestionId, q.selectedOptionId) === opt.id}
                      onChange={(e) => handleOptionSelect(q.attemptQuestionId, e.target.value)}
                      className="size-4 text-primary"
                    />
                    <span className="flex-1 font-normal leading-relaxed text-sm">
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          {Object.keys(answers).length} of {attempt.questions.length} answered
        </p>
        <Button
          disabled={(!allAnswered && !isExpired) || submitAttempt.isPending}
          onClick={handleSubmit}
          size="lg"
        >
          {submitAttempt.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Submit attempt
        </Button>
      </div>
    </div>
  );
}
