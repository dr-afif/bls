import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Layers3, Pencil, Plus, Tags, ToggleLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { StatePanel } from "../../../components/common/state-panel";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useAccountAccess } from "../../auth/hooks/use-account-access";
import { ResourceAdminState } from "../components/resource-admin-ui";
import { TaxonomyItemForm } from "../components/taxonomy-item-form";
import { useAdminResourceTaxonomy, useAdminResourceTaxonomyMutations } from "../hooks/use-admin-resource-taxonomy";
import type { ResourceTaxonomyFormValues } from "../model/resource-taxonomy-form-utils";
import type { ResourceTaxonomyItem, ResourceTaxonomyKind } from "../model/resource-taxonomy-types";

function date(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message === "RESOURCE_TAXONOMY_SLUG_CONFLICT") return "That generated slug is already in use. Choose a more specific name.";
  if (error instanceof Error && error.message === "RESOURCE_TAXONOMY_DEACTIVATION_BLOCKED") return "Reassign the affected published resources before deactivating this item.";
  return "The taxonomy change could not be saved. No partial change was applied.";
}

function resourceCount(count: number) {
  return `${count} ${count === 1 ? "resource" : "resources"}`;
}

function TaxonomySection({ items, kind, onNotice, organizationId }: { items: ResourceTaxonomyItem[]; kind: ResourceTaxonomyKind; onNotice: (message: string, error?: boolean) => void; organizationId: string }) {
  const mutations = useAdminResourceTaxonomyMutations();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const label = kind === "topic" ? "BLS topics" : "Teaching stages";
  const Icon = kind === "topic" ? Tags : Layers3;
  const busy = mutations.create.isPending || mutations.update.isPending || mutations.setActive.isPending;

  const create = async (values: ResourceTaxonomyFormValues & { slug: string }) => {
    try {
      await mutations.create.mutateAsync({ description: values.description.trim() || null, displayOrder: Number(values.displayOrder), kind, name: values.name, organizationId, slug: values.slug });
      setAdding(false);
      onNotice(`${kind === "topic" ? "Topic" : "Teaching stage"} created and audit recorded.`);
    } catch (error) { onNotice(errorMessage(error), true); }
  };

  const update = async (item: ResourceTaxonomyItem, values: ResourceTaxonomyFormValues & { slug: string }) => {
    try {
      await mutations.update.mutateAsync({ description: values.description.trim() || null, displayOrder: Number(values.displayOrder), id: item.id, kind, name: values.name });
      setEditingId(null);
      onNotice(`${item.name} updated and audit recorded.`);
    } catch (error) { onNotice(errorMessage(error), true); }
  };

  const toggle = async (item: ResourceTaxonomyItem) => {
    const action = item.active ? "deactivate" : "activate";
    if (item.active && !window.confirm(`Deactivate “${item.name}”? It will no longer be offered for new assignments. Existing historical assignments are preserved.`)) return;
    try {
      await mutations.setActive.mutateAsync({ active: !item.active, id: item.id, kind });
      onNotice(`${item.name} ${action}d and audit recorded.`);
    } catch (error) { onNotice(errorMessage(error), true); }
  };

  return <Card className="min-w-0">
    <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle><Icon aria-hidden="true" className="mr-2 inline size-5" />{label}</CardTitle><Badge variant="neutral">{items.filter((item) => item.active).length} active · {items.length} total</Badge></div></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">{kind === "topic" ? "Clinical discovery labels used across learner and instructor resources." : "Instructor teaching-kit labels for moments such as preparation, demonstration, and debrief."}</p>
      {!adding ? <Button onClick={() => setAdding(true)} variant="outline"><Plus aria-hidden="true" />Add {kind === "topic" ? "topic" : "teaching stage"}</Button> : <TaxonomyItemForm busy={busy} kind={kind} onCancel={() => setAdding(false)} onSubmit={create} />}
      {items.length === 0 ? <StatePanel compact kind="empty" title={`No ${label.toLowerCase()} yet`} description="Add the first label for this organization." /> : <ol className="space-y-3">
        {items.map((item) => <li className="rounded-xl border p-4" key={item.id}>
          {editingId === item.id ? <TaxonomyItemForm busy={busy} item={item} kind={kind} onCancel={() => setEditingId(null)} onSubmit={(values) => update(item, values)} /> : <>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{item.active ? <Badge variant="success"><CheckCircle2 aria-hidden="true" className="size-3.5" />Active</Badge> : <Badge variant="neutral"><ToggleLeft aria-hidden="true" className="size-3.5" />Inactive</Badge>}<Badge variant="neutral">Order {item.displayOrder}</Badge></div><h3 className="mt-2 font-bold">{item.name}</h3><p className="mt-1 break-all text-xs text-muted-foreground">{item.slug}</p>{item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}</div>
              <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => setEditingId(item.id)} size="sm" variant="outline"><Pencil aria-hidden="true" />Edit</Button><Button disabled={busy || (item.active && item.blockingPublishedResourceCount > 0)} onClick={() => void toggle(item)} size="sm" variant={item.active ? "ghost" : "outline"}><ToggleLeft aria-hidden="true" />{item.active ? "Deactivate" : "Activate"}</Button></div>
            </div>
            <dl className="mt-4 grid gap-3 border-t pt-3 text-sm sm:grid-cols-3"><div><dt className="font-semibold">All assignments</dt><dd className="text-muted-foreground">{resourceCount(item.usageCount)}</dd></div><div><dt className="font-semibold">Published use</dt><dd className="text-muted-foreground">{resourceCount(item.publishedUsageCount)}</dd></div><div><dt className="font-semibold">Blocking publication</dt><dd className="text-muted-foreground">{resourceCount(item.blockingPublishedResourceCount)}</dd></div></dl>
            {item.active && item.blockingPublishedResourceCount > 0 && <p className="mt-3 flex gap-2 rounded-lg border border-warning/25 bg-warning-soft p-3 text-sm text-warning"><AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Reassign {item.blockingPublishedResourceCount} published {item.blockingPublishedResourceCount === 1 ? "resource" : "resources"} before deactivation.</p>}
            {!item.active && item.usageCount > 0 && <p className="mt-3 text-xs text-muted-foreground">Existing assignments remain visible for history and can be removed from individual resources, but this item cannot be newly assigned.</p>}
          </>}
        </li>)}
      </ol>}
    </CardContent>
  </Card>;
}

export function ResourceTaxonomyPage() {
  const access = useAccountAccess();
  const taxonomy = useAdminResourceTaxonomy();
  const [notice, setNotice] = useState<{ error: boolean; message: string }>({ error: false, message: "" });
  if (taxonomy.isPending || taxonomy.isError) return <ResourceAdminState query={taxonomy} />;
  const organizationId = access.data?.profile?.organizationId;
  if (access.isPending) return <StatePanel kind="loading" title="Checking administrator access" description="Confirming the organization for taxonomy changes." />;
  if (access.isError || !organizationId) return <StatePanel as="h1" kind="error" title="Taxonomy management is unavailable" description="Your administrator profile must belong to an organization before taxonomy can be changed." />;

  return <div className="space-y-6">
    <PageHeader action={<Button asChild variant="ghost"><Link to="/app/admin/resources"><ArrowLeft aria-hidden="true" />Back to resources</Link></Button>} description="Add, rename, order, activate, and safely retire resource-discovery labels. Stable slugs and historical assignments are preserved." eyebrow="Administrator workspace" title="Resource taxonomy" />
    <div aria-live="polite" className={notice.error ? "text-sm font-medium text-destructive" : "text-sm font-medium text-info"}>{notice.message}</div>
    <section aria-label="Taxonomy safeguards" className="grid gap-3 rounded-2xl border border-info/25 bg-info-soft p-4 text-sm text-info sm:grid-cols-3"><p><strong>No deletion.</strong> Deactivation preserves historical use.</p><p><strong>Stable slugs.</strong> Names and ordering can change without breaking identifiers.</p><p><strong>Publication safe.</strong> Server rules block removal of a published resource’s last active label.</p></section>
    <div className="grid min-w-0 gap-6 xl:grid-cols-2">
      <TaxonomySection items={taxonomy.data?.topics ?? []} kind="topic" onNotice={(message, error = false) => setNotice({ error, message })} organizationId={organizationId} />
      <TaxonomySection items={taxonomy.data?.stages ?? []} kind="stage" onNotice={(message, error = false) => setNotice({ error, message })} organizationId={organizationId} />
    </div>
    <Card><CardHeader><CardTitle><Activity aria-hidden="true" className="mr-2 inline size-5" />Recent taxonomy activity</CardTitle></CardHeader><CardContent>{taxonomy.data?.auditEvents.length ? <ol className="grid gap-3 md:grid-cols-2">{taxonomy.data.auditEvents.slice(0, 12).map((event) => <li className="border-l-2 border-primary/25 pl-3 text-sm" key={event.id}><p className="font-semibold">{event.itemName} · {event.action.replace("resource_taxonomy.", "").replaceAll("_", " ")}</p><p className="mt-1 text-muted-foreground">{event.actorName} · {date(event.createdAt)}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">No recent taxonomy changes are available.</p>}</CardContent></Card>
  </div>;
}
