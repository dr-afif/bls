import {
  CheckCircle2,
  FilePlus2,
  LockKeyhole,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function AdminQuizzesPage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);
  const [postTestReleased, setPostTestReleased] = useState(false);
  const [notice, setNotice] = useState("");

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <Button
            onClick={() =>
              setNotice("Prototype only: no quiz content was created.")
            }
          >
            <FilePlus2 aria-hidden="true" />
            Add quiz content
          </Button>
        }
        description="Review fictional pre-test and post-test content, release presentation and review policy."
        eyebrow="Administration"
        title="Quizzes"
      />

      <p aria-live="polite" className="text-sm text-info">
        {notice}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {adminState.data.quizzes.map((quiz) => {
          const isPostTest = quiz.type === "post-test";
          const released = isPostTest ? postTestReleased : true;
          return (
            <Card className="shadow-none" key={quiz.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {quiz.type === "pre-test" ? "Before course" : "After course"}
                    </p>
                    <CardTitle className="mt-1">{quiz.title}</CardTitle>
                  </div>
                  <Badge variant={released ? "success" : "warning"}>
                    {released ? (
                      <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    ) : (
                      <LockKeyhole aria-hidden="true" className="size-3.5" />
                    )}
                    {released ? "Available" : "Not released"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Questions</dt>
                    <dd className="font-semibold">{quiz.questions}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Suggested time</dt>
                    <dd className="font-semibold">{quiz.timeMinutes} minutes</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Review</dt>
                    <dd className="font-semibold">Score and topic summary</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Answers</dt>
                    <dd className="font-semibold">Policy-controlled</dd>
                  </div>
                </dl>
                {isPostTest && (
                  <Button
                    aria-pressed={postTestReleased}
                    className="mt-5"
                    onClick={() =>
                      setPostTestReleased((releasedState) => !releasedState)
                    }
                    variant="outline"
                  >
                    {postTestReleased ? (
                      <LockKeyhole aria-hidden="true" />
                    ) : (
                      <Unlock aria-hidden="true" />
                    )}
                    {postTestReleased
                      ? "Preview unreleased state"
                      : "Preview manual release"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-semibold">Release is not enforced</h2>
          <p className="mt-1 text-sm">
            The production MVP will require an authorized instructor or
            administrator action after the physical course. This toggle changes
            local presentation state only.
          </p>
        </div>
      </div>
    </div>
  );
}

