import {
  ArrowLeft,
  Check,
  FileText,
  Maximize2,
  Minimize2,
  Play,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useDemoSession } from "../../demo/context/demo-session-context";
import { prototypeRepository } from "../data/prototype-repository";
import { useRepositoryValue } from "../hooks/use-repository-value";

const guideSteps = [
  "Check that the scene is safe before approaching.",
  "Check response and normal breathing.",
  "Call for emergency help and request an AED.",
  "Start high-quality chest compressions.",
  "Use the AED as soon as it is available.",
];

const checklistItems = [
  "Confirm nobody is touching the person.",
  "State “stand clear” in a clear voice.",
  "Visually check the area before shock delivery.",
  "Resume chest compressions immediately after the shock.",
];

export function ResourceViewerPage() {
  const { resourceId = "" } = useParams();
  const { role } = useDemoSession();
  const loadResource = useCallback(
    () => prototypeRepository.getResource(resourceId),
    [resourceId],
  );
  const resourceState = useRepositoryValue(loadResource);
  const [playing, setPlaying] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  useEffect(() => {
    if (!presentationMode) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentationMode(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [presentationMode]);

  if (resourceState.status === "loading") return <StatePanel kind="loading" />;
  if (resourceState.status === "error") {
    return (
      <StatePanel
        description="This fictional guide could not be found."
        kind="error"
      />
    );
  }

  const resource = resourceState.data;
  const instructorView = role === "instructor";
  const libraryPath = instructorView
    ? "/demo/instructor/teaching-kit"
    : "/demo/learner/guides";

  return (
    <div
      className={
        presentationMode
          ? "fixed inset-0 z-[200] overflow-y-auto bg-background p-4 sm:p-8"
          : "space-y-7"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to={libraryPath}>
            <ArrowLeft aria-hidden="true" />
            Back to {instructorView ? "Teaching Kit" : "Guides"}
          </Link>
        </Button>
        {instructorView && (
          <Button
            aria-pressed={presentationMode}
            onClick={() => setPresentationMode((active) => !active)}
            variant="outline"
          >
            {presentationMode ? (
              <Minimize2 aria-hidden="true" />
            ) : (
              <Maximize2 aria-hidden="true" />
            )}
            {presentationMode ? "Exit presentation view" : "Presentation view"}
          </Button>
        )}
      </div>

      <PageHeader
        description={resource.summary}
        eyebrow={`${resource.topic} · ${resource.type}`}
        title={resource.title}
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{resource.type}</Badge>
        <Badge>{resource.duration}</Badge>
        <Badge>{resource.updatedAt}</Badge>
        {instructorView && <Badge variant="info">{resource.teachingStage}</Badge>}
      </div>

      {resource.type === "video" && (
        <section aria-labelledby="video-preview-heading">
          <h2 className="sr-only" id="video-preview-heading">
            Video preview
          </h2>
          <div className="flex aspect-video max-h-[70vh] items-center justify-center rounded-xl border bg-primary text-primary-foreground">
            <div className="max-w-md p-6 text-center" aria-live="polite">
              <Button
                aria-label={playing ? "Pause video preview" : "Play video preview"}
                className="mx-auto size-14 rounded-full bg-white text-primary hover:bg-white/90"
                onClick={() => setPlaying((active) => !active)}
                size="icon"
              >
                <Play aria-hidden="true" className="size-6" />
              </Button>
              <p className="mt-4 font-semibold">
                {playing ? "Local video state active" : "Video player pattern"}
              </p>
              <p className="mt-1 text-sm text-white/75">
                No media is loaded or streamed in this prototype.
              </p>
            </div>
          </div>
        </section>
      )}

      {resource.type === "document" && (
        <section aria-labelledby="document-preview-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold" id="document-preview-heading">
              Document preview
            </h2>
            <Badge>
              <FileText aria-hidden="true" className="size-3.5" />
              Page 1 of 6
            </Badge>
          </div>
          <div className="mx-auto min-h-[30rem] max-w-3xl rounded-xl border bg-card p-6 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-primary">
              Quick reference
            </p>
            <h3 className="mt-3 text-2xl font-bold">{resource.title}</h3>
            <p className="mt-5 max-w-reading text-muted-foreground">
              This accessible HTML preview represents a future protected
              document viewer. It preserves readable text and does not expose a
              downloadable file.
            </p>
            <div className="mt-8 space-y-4">
              {guideSteps.slice(0, 3).map((step, index) => (
                <div className="flex gap-4 border-t pt-4" key={step}>
                  <span className="font-bold text-primary">{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {resource.type === "guide" && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>At-a-glance sequence</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="divide-y">
              {guideSteps.map((step, index) => (
                <li className="flex gap-4 py-4 first:pt-0 last:pb-0" key={step}>
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <span className="pt-1 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {resource.type === "checklist" && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Safety checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset>
              <legend className="sr-only">AED safety checklist items</legend>
              <div className="divide-y">
                {checklistItems.map((item) => {
                  const checked = checkedItems.includes(item);
                  return (
                    <label
                      className="flex min-h-14 cursor-pointer items-start gap-3 py-3"
                      key={item}
                    >
                      <input
                        checked={checked}
                        className="mt-1 size-5 accent-primary"
                        onChange={() =>
                          setCheckedItems((current) =>
                            checked
                              ? current.filter((value) => value !== item)
                              : [...current, item],
                          )
                        }
                        type="checkbox"
                      />
                      <span className="font-medium">{item}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Check aria-hidden="true" className="size-4" />
              Checklist selections are temporary viewing aids and are not saved.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          This is a fictional presentation pattern. Protected access,
          watermarking, streaming and engagement tracking are not implemented.
        </p>
      </div>
    </div>
  );
}
