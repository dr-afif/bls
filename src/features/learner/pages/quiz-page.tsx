import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileQuestion,
  LockKeyhole,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

export function LearnerQuizPage() {
  const learnerState = useRepositoryValue(
    prototypeRepository.getLearnerSnapshot,
  );
  const [previewReleased, setPreviewReleased] = useState(false);

  if (learnerState.status === "loading") return <StatePanel kind="loading" />;
  if (learnerState.status === "error") return <StatePanel kind="error" />;

  const [preTest, postTest] = learnerState.data.quizzes;

  return (
    <div className="space-y-7">
      <PageHeader
        description="Check assessment availability and review permitted result summaries."
        eyebrow="Course assessments"
        title="Quiz"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">Before course</p>
                <CardTitle className="mt-1">{preTest.title}</CardTitle>
              </div>
              <Badge variant="success">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <FileQuestion aria-hidden="true" className="size-4" />
                {preTest.questions} questions
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="size-4" />
                About {preTest.timeMinutes} minutes
              </span>
            </div>
            <p className="mt-4 text-sm">{preTest.availabilityNote}</p>
            <Button asChild className="mt-5">
              <Link to="/demo/learner/quiz/result">
                View score and topics
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">After course</p>
                <CardTitle className="mt-1">{postTest.title}</CardTitle>
              </div>
              {previewReleased ? (
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
                <FileQuestion aria-hidden="true" className="size-4" />
                {postTest.questions} questions
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 aria-hidden="true" className="size-4" />
                About {postTest.timeMinutes} minutes
              </span>
            </div>
            <p className="mt-4 text-sm">
              {previewReleased
                ? "Demo released state. A secure production release has not occurred."
                : postTest.availabilityNote}
            </p>
            <Button className="mt-5" disabled={!previewReleased}>
              {previewReleased ? "Preview post-test entry" : "Post-test unavailable"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-warning/25 bg-warning-soft p-4">
        <div className="flex gap-3 text-warning">
          <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Prototype release control</h2>
            <p className="mt-1 text-sm">
              In production, an authorized instructor or administrator will
              release the post-test after the physical course. This local
              toggle demonstrates the two visual states only.
            </p>
            <Button
              aria-pressed={previewReleased}
              className="mt-4"
              onClick={() => setPreviewReleased((released) => !released)}
              variant="outline"
            >
              {previewReleased ? (
                <LockKeyhole aria-hidden="true" />
              ) : (
                <Unlock aria-hidden="true" />
              )}
              {previewReleased
                ? "Show unreleased state"
                : "Preview released state"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

