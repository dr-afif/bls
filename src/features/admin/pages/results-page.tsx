import { BarChart3, Download, Info } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { prototypeRepository } from "../../prototype/data/prototype-repository";
import { useRepositoryValue } from "../../prototype/hooks/use-repository-value";

const exportOptions = [
  "Cohort roster CSV",
  "Quiz results CSV",
  "Pre/post comparison CSV",
];

export function AdminResultsPage() {
  const adminState = useRepositoryValue(prototypeRepository.getAdminSnapshot);
  const [notice, setNotice] = useState("");

  if (adminState.status === "loading") return <StatePanel kind="loading" />;
  if (adminState.status === "error") return <StatePanel kind="error" />;

  const comparison = adminState.data.topicComparison;
  const preMedian = 63;
  const postMedian = 84;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Accessible fictional pre-test and post-test comparison for cohort BLS-2521."
        eyebrow="Administration"
        title="Results"
      />

      <div className="flex flex-wrap gap-2">
        {exportOptions.map((label) => (
          <Button
            key={label}
            onClick={() =>
              setNotice(`Prototype only: ${label} was not generated.`)
            }
            variant="outline"
          >
            <Download aria-hidden="true" />
            {label} · Prototype
          </Button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm text-info">
        {notice}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pre-test median</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{preMedian}%</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Post-test median</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{postMedian}%</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Median change</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">+21</p>
          <p className="text-xs text-muted-foreground">percentage points</p>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="size-5 text-accent" />
              Topic comparison
            </CardTitle>
            <div className="flex gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm bg-primary"
                />
                Pre-test
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm bg-accent"
                />
                Post-test
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            aria-label="Topic score comparison. Post-test scores are higher than pre-test scores in all four topics."
            className="space-y-5"
            role="img"
          >
            {comparison.map((item) => (
              <div key={item.topic}>
                <p className="mb-2 text-sm font-semibold">{item.topic}</p>
                <div className="grid grid-cols-[4rem_1fr_3rem] items-center gap-2 text-xs">
                  <span>Pre-test</span>
                  <div className="h-3 rounded-full bg-secondary">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${item.preTest}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums">{item.preTest}%</span>
                  <span>Post-test</span>
                  <div className="h-3 rounded-full bg-secondary">
                    <div
                      className="h-3 rounded-full bg-accent"
                      style={{ width: `${item.postTest}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums">
                    {item.postTest}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">
                Data table alternative for the topic comparison chart
              </caption>
              <thead className="bg-muted/65">
                <tr>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Topic
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Pre-test
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Post-test
                  </th>
                  <th className="px-4 py-3 font-semibold" scope="col">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.map((item) => (
                  <tr key={item.topic}>
                    <th className="px-4 py-3 font-semibold" scope="row">
                      {item.topic}
                    </th>
                    <td className="px-4 py-3 tabular-nums">{item.preTest}%</td>
                    <td className="px-4 py-3 tabular-nums">{item.postTest}%</td>
                    <td className="px-4 py-3 tabular-nums">
                      +{item.postTest - item.preTest}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 rounded-xl border border-info/20 bg-info-soft p-4 text-info">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <p className="text-sm">
          All results are fictional. Filters, secure aggregation, cohort scope,
          audit logging and real exports are deferred to the production MVP.
        </p>
      </div>
    </div>
  );
}
