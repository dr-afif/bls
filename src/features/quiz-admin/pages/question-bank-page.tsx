import { FilePlus2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { questionTypeLabels } from "../data/quiz-admin-repository";
import { AuthoringStatusBadge, QuizAdminNav, QuizAdminState } from "../components/quiz-admin-ui";
import { useQuizAdminCatalog } from "../hooks/use-quiz-admin";

export function QuestionBankPage() {
  const catalog = useQuizAdminCatalog();
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => catalog.data?.questions.filter((question) => {
    const latest = question.versions[0];
    return latest?.prompt.toLowerCase().includes(search.trim().toLowerCase()) || question.courseTitle.toLowerCase().includes(search.trim().toLowerCase());
  }) ?? [], [catalog.data, search]);
  if (catalog.isPending || catalog.isError) return <QuizAdminState query={catalog} />;
  return <div className="space-y-6"><PageHeader action={<Button asChild><Link to="/app/admin/questions/new"><FilePlus2 aria-hidden="true" />New question</Link></Button>} description="Manage stable question identities and immutable versions. Correctness keys remain visible only in this administrator workspace." eyebrow="Assessment authoring" title="Question bank" /><QuizAdminNav />
    <label className="block max-w-xl text-sm font-semibold">Search question bank<div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" /><Input className="pl-10" onChange={(event) => setSearch(event.target.value)} placeholder="Search prompt or course" value={search} /></div></label>
    <p aria-live="polite" className="text-sm text-muted-foreground">Showing {filtered.length} of {catalog.data?.questions.length ?? 0} stable questions.</p>
    {catalog.data?.questions.length === 0 ? <QuizAdminState empty query={catalog} /> : filtered.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No questions match this search.</p> : <div className="grid gap-4">{filtered.map((question) => { const latest = question.versions[0]; return <article className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5" key={question.id}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{latest && <AuthoringStatusBadge status={latest.status} />}{latest && <Badge variant="neutral">{questionTypeLabels[latest.type]}</Badge>}<Badge variant="neutral">{question.versions.length} version{question.versions.length === 1 ? "" : "s"}</Badge></div><h2 className="mt-3 line-clamp-2 text-lg font-bold">{latest?.prompt ?? "Question draft unavailable"}</h2><p className="mt-1 text-sm text-muted-foreground">{question.courseTitle}</p></div><Button asChild variant="outline"><Link to={`/app/admin/questions/${question.id}`}>Manage question</Link></Button></div></article>; })}</div>}
  </div>;
}
