import { CalendarRange, LogOut, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../auth/context/auth-context";
import type { AppRole } from "../../auth/model/auth-types";

const roleLabels: Record<AppRole, string> = {
  admin: "Administrator",
  super_admin: "Super administrator",
  instructor: "Instructor",
  learner: "Learner",
};

export function OperationsShell({ role }: { role: AppRole }) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const links = role === "admin" || role === "super_admin"
    ? [
        { to: "/app/admin/people", label: "People", icon: Users },
        { to: "/app/admin/cohorts", label: "Cohorts", icon: CalendarRange },
      ]
    : [{
        to: role === "instructor" ? "/app/instructor/cohorts" : "/app/learner/cohort",
        label: role === "instructor" ? "Cohorts" : "My course",
        icon: CalendarRange,
      }];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <a className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground focus:translate-y-0" href="#main-content">
        Skip to main content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <AppLogo compact />
          <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            Live development data
          </span>
          <p className="mr-auto text-sm text-muted-foreground">{roleLabels[role]}</p>
          <Button variant="ghost" onClick={() => void signOut().then(() => navigate("/auth/login", { replace: true }))}>
            <LogOut aria-hidden="true" /> Sign out
          </Button>
        </div>
        <nav aria-label={`${roleLabels[role]} workspace`} className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink className={({ isActive }) => cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold", isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary")} key={link.to} to={link.to}>
                <Icon aria-hidden="true" className="size-4" /> {link.label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8" id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
