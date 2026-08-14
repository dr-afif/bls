import { AlertTriangle, FileLock2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useAuth } from "../../auth/context/auth-context";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { fetchProtectedPdf } from "../data/resource-access-service";
import type { CourseResource } from "../model/resource-types";

const inFlightPdfRequests = new Map<string, ReturnType<typeof fetchProtectedPdf>>();

function requestProtectedPdf(
  client: Parameters<typeof fetchProtectedPdf>[0],
  requestKey: string,
  resourceVersionId: string,
) {
  const existing = inFlightPdfRequests.get(requestKey);
  if (existing) return existing;
  const request = fetchProtectedPdf(client, resourceVersionId);
  inFlightPdfRequests.set(requestKey, request);
  void request.then(
    () => queueMicrotask(() => inFlightPdfRequests.delete(requestKey)),
    () => queueMicrotask(() => inFlightPdfRequests.delete(requestKey)),
  );
  return request;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; document: PDFDocumentProxy; expiresIn: number }
  | { status: "offline" | "expired" | "denied" | "rate_limited" | "error" };

function PdfPage({ pageNumber, document }: { pageNumber: number; document: PDFDocumentProxy }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<RenderTask | null>(null);
  const [pageText, setPageText] = useState("");

  useEffect(() => {
    let active = true;
    let page: PDFPageProxy | null = null;

    void document.getPage(pageNumber).then(async (loadedPage) => {
      if (!active || !canvasRef.current) return;
      page = loadedPage;
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderRef.current = page.render({ canvas, canvasContext: context, viewport });
      await renderRef.current.promise;
      const text = await page.getTextContent();
      if (active) setPageText(text.items.flatMap((item) => "str" in item ? [item.str] : []).join(" "));
    }).catch(() => undefined);

    return () => {
      active = false;
      renderRef.current?.cancel();
      page?.cleanup();
    };
  }, [document, pageNumber]);

  return (
    <section aria-label={`Document page ${pageNumber}`} className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border bg-white shadow-card">
      <canvas aria-hidden="true" className="block h-auto w-full" ref={canvasRef} />
      <p className="sr-only">Page {pageNumber}: {pageText || "Text is loading."}</p>
    </section>
  );
}

function classifyError(error: unknown): "offline" | "expired" | "denied" | "rate_limited" | "error" {
  const code = error instanceof Error ? error.message : "";
  if (code === "RESOURCE_ACCESS_OFFLINE") return "offline";
  if (code === "RESOURCE_ACCESS_EXPIRED") return "expired";
  if (code === "RESOURCE_ACCESS_DENIED") return "denied";
  if (code === "RESOURCE_ACCESS_RATE_LIMITED") return "rate_limited";
  return "error";
}

export function ProtectedPdfViewer({ resource }: { resource: CourseResource }) {
  const { client, state: authState } = useAuth();
  const account = useAccountAccess();
  const [attempt, setAttempt] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let loadedDocument: PDFDocumentProxy | null = null;

    if (!client) return undefined;

    const userId = authState.status === "signed_in" ? authState.user.id : "signed-out";
    const requestKey = `${userId}:${resource.versionId}:${attempt}`;
    void requestProtectedPdf(client, requestKey, resource.versionId)
      .then(async ({ bytes, expiresIn }) => {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;
        const task = pdfjs.getDocument({ data: bytes });
        loadedDocument = await task.promise;
        if (active) setLoadState({ status: "ready", document: loadedDocument, expiresIn });
        else await loadedDocument.cleanup();
      })
      .catch((error: unknown) => {
        if (active) setLoadState({ status: classifyError(error) });
      });

    return () => {
      active = false;
      if (loadedDocument) void loadedDocument.cleanup();
    };
  }, [attempt, authState, client, resource.versionId]);

  const retry = () => {
    setLoadState({ status: "loading" });
    setAttempt((value) => value + 1);
  };

  if (!client) {
    return <StatePanel description="Sign in again to request protected document access." kind="denied" title="Document access unavailable" />;
  }

  if (loadState.status === "loading") {
    return <StatePanel kind="loading" title="Opening protected document" description="Authorizing access and preparing the document in this browser session." />;
  }
  if (loadState.status !== "ready") {
    const copy = {
      offline: { kind: "offline" as const, title: "Connection required", description: "Protected documents are not stored for offline use. Reconnect and try again." },
      expired: { kind: "expired" as const, title: "Document access expired", description: "The short-lived document link has expired. Request a fresh viewing session." },
      denied: { kind: "denied" as const, title: "Document access unavailable", description: "Your current account or course access does not permit this document." },
      rate_limited: { kind: "error" as const, title: "Too many document requests", description: "Wait about one minute before requesting this protected document again." },
      error: { kind: "error" as const, title: "Document could not be opened", description: "The protected file was not retained. Check your connection and try again." },
    }[loadState.status];
    return <StatePanel actionLabel={loadState.status === "denied" ? undefined : "Try again"} description={copy.description} kind={copy.kind} onAction={loadState.status === "denied" ? undefined : retry} title={copy.title} />;
  }

  const userId = authState.status === "signed_in" ? authState.user.id : "unknown";
  const watermark = `${account.data?.profile?.fullName ?? "Authorized user"} · ${userId.slice(0, 8)} · ${new Date().toLocaleString()}`;

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5 sm:pt-6">
          <div className="flex gap-3">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success"><ShieldCheck className="size-5" /></span>
            <div><h2 className="font-semibold">Authorized session view</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Access was checked when this document opened. It is rendered from in-memory bytes and is not available offline.</p></div>
          </div>
          <Badge variant="success"><FileLock2 aria-hidden="true" className="size-3.5" /> {loadState.document.numPages} {loadState.document.numPages === 1 ? "page" : "pages"}</Badge>
        </CardContent>
      </Card>

      <div className="relative space-y-4" data-protected-document="memory-only">
        {Array.from({ length: loadState.document.numPages }, (_, index) => <PdfPage document={loadState.document} key={index + 1} pageNumber={index + 1} />)}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around overflow-hidden px-4 text-center font-semibold uppercase tracking-wide text-primary/20">
          {[0, 1, 2].map((item) => <span className="-rotate-12 rounded-lg border-2 border-primary/15 px-4 py-2 text-xs sm:text-sm" key={item}>Authorized training use only · {watermark}</span>)}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-warning">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">This control reduces casual copying but cannot prevent screenshots or recording. Do not share protected course material.</p>
      </div>
      <Button onClick={retry} variant="outline"><RefreshCw aria-hidden="true" /> Refresh access</Button>
    </div>
  );
}
