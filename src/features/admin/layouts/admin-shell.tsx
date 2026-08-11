import {
  BarChart3,
  CalendarRange,
  Files,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { DemoBanner } from "../../../components/common/demo-banner";
import { Button } from "../../../components/ui/button";
import { useDemoSession } from "../../demo/context/demo-session-context";
import { cn } from "../../../lib/utils";

const adminNavigation = [
  { to: "/demo/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/demo/admin/people", label: "People", icon: Users },
  { to: "/demo/admin/cohorts", label: "Cohorts", icon: CalendarRange },
  { to: "/demo/admin/resources", label: "Resources", icon: Files },
  { to: "/demo/admin/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/demo/admin/results", label: "Results", icon: BarChart3 },
  { to: "/demo/admin/settings", label: "Settings", icon: Settings },
];

function adminNavigationClass(isActive: boolean) {
  return cn(
    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-200",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function AdminShell() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const { resetDemo, setRole } = useDemoSession();

  useEffect(() => {
    setRole("administrator");
  }, [setRole]);

  useEffect(() => {
    window.scrollTo({ behavior: "auto", top: 0 });
    mainRef.current?.focus({ preventScroll: true });
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <a
        className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:flex lg:flex-col">
        <div className="border-b p-5">
          <AppLogo />
          <DemoBanner className="mt-4" />
        </div>
        <nav
          aria-label="Administrator navigation"
          className="scrollbar-subtle flex-1 overflow-y-auto p-3"
        >
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Course operations
          </p>
          <div className="space-y-1">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) =>
                    adminNavigationClass(isActive)
                  }
                  key={item.to}
                  to={item.to}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
          <div className="my-4 border-t" />
          <NavLink
            className={({ isActive }) => adminNavigationClass(isActive)}
            to="/demo/admin/states"
          >
            <FlaskConical aria-hidden="true" className="size-5" />
            State patterns
          </NavLink>
        </nav>
        <div className="border-t p-4">
          <Button
            asChild
            className="w-full justify-start"
            onClick={resetDemo}
            variant="ghost"
          >
            <Link to="/">
              <LogOut aria-hidden="true" />
              Change demo role
            </Link>
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b bg-card lg:hidden">
          <div className="flex min-h-16 items-center gap-3 px-4">
            <AppLogo compact />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-sm font-bold leading-tight">BLS Operations</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                <span className="shrink-0">Administrator prototype</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium">
                  Demo data
                </span>
              </div>
            </div>
          </div>
          <details className="group border-t" ref={menuRef}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 px-4 text-sm font-semibold text-primary hover:bg-muted">
              <Menu aria-hidden="true" className="size-4" />
              Administration menu
            </summary>
            <nav
              aria-label="Mobile administrator navigation"
              className="grid gap-1 border-t bg-card p-3 sm:grid-cols-2"
            >
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    className={({ isActive }) =>
                      adminNavigationClass(isActive)
                    }
                    key={item.to}
                    to={item.to}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </details>
        </header>

        <main
          className="mx-auto min-h-dvh w-full max-w-[100rem] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
