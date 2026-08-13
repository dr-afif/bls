import { ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useAuth } from "../context/auth-context";
import { useAccountAccess } from "../hooks/use-account-access";
import type { AppRole } from "../model/auth-types";

const roleLabels: Record<AppRole, string> = {
  admin: "Administrator",
  instructor: "Instructor",
  learner: "Learner",
  super_admin: "Super administrator",
};

export function ProductionWorkspacePage({ role }: { role: AppRole }) {
  const { signOut } = useAuth();
  const { data } = useAccountAccess();
  const navigate = useNavigate();

  return (
    <main className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <AppLogo compact />
          <Button variant="ghost" onClick={() => void signOut().then(() => navigate("/auth/login", { replace: true }))}>
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
          <ShieldCheck aria-hidden="true" className="size-4" /> Authenticated · Active account
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome, {data?.profile?.fullName ?? roleLabels[role]}
        </h1>
        <p className="mt-3 text-muted-foreground">Your {roleLabels[role].toLowerCase()} role has been verified by the application database.</p>
        <Card className="mt-8">
          <CardHeader><CardTitle>Production access foundation is ready</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Protected course data, resources, quizzes, scoring, and administrative operations are not connected in this milestone. The existing learning journey remains fictional demo data.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link to="/demo">Open the clearly labelled demo <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
