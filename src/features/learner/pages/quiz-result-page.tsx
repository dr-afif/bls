import { ArrowLeft, BarChart3, Info } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function LearnerQuizResultPage() {
  const learnerState = useRepositoryValue(
    prototypeRepository.getLearnerSnapshot,
  );

  if (learnerState.status === "loading") return <StatePanel kind="loading" />;
  if (learnerState.status === "error") return <StatePanel kind="error" />;

  const result = learnerState.data.latestResult;

  return (
    <div className="space-y-7">
      <Button asChild variant="ghost">
        <Link to="/demo/learner/quiz">
          <ArrowLeft aria-hidden="true" />
          Back to Quiz
        </Link>
      </Button>

      <PageHeader
        description={`${result.completedAt}. This summary contains fictional local demo data.`}
        eyebrow="Personal result"
        title={result.quizTitle}
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <Card className="shadow-none">
          <CardContent className="flex min-h-56 flex-col items-center justify-center pt-5 text-center sm:pt-6">
            <BarChart3 aria-hidden="true" className="size-7 text-accent" />
            <p className="mt-3 text-5xl font-bold tabular-nums">
              {result.score}%
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Overall score</p>
            <Badge className="mt-4" variant="info">
              Pre-test baseline
            </Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Topic-level summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {result.topicResults.map((topic) => (
                <div key={topic.topic}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold">{topic.topic}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {topic.score}%
                    </span>
                  </div>
                  <div
                    aria-label={`${topic.topic}: ${topic.score}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={topic.score}
                    className="h-2.5 overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${topic.score}%` }}
                    />
                  </div>
                </div>
              ))}
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

