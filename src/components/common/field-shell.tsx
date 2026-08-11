import type { LucideIcon } from "lucide-react";
import { FlaskConical, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useDemoSession } from "../../features/demo/context/demo-session-context";
import type { DemoRole } from "../../features/demo/model/demo-role";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { AppLogo } from "./app-logo";
import { DemoBanner } from "./demo-banner";

export type FieldNavigationItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type FieldShellProps = {
  role: Extract<DemoRole, "learner" | "instructor">;
  roleLabel: string;
  navigationLabel: string;
  navigation: FieldNavigationItem[];
  profilePath: string;
  statePatternsPath: string;
};

function navigationClass(isActive: boolean) {
  return cn(
    "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-200",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function FieldShell({
  navigation,
  navigationLabel,
  profilePath,
  role,
  roleLabel,
  statePatternsPath,
}: FieldShellProps) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { resetDemo, setRole } = useDemoSession();

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  useEffect(() => {
    window.scrollTo({ behavior: "auto", top: 0 });
    mainRef.current?.focus({ preventScroll: true });
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
          aria-label={navigationLabel}
          className="scrollbar-subtle flex-1 overflow-y-auto p-4"
        >
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {roleLabel} companion
          </p>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  className={({ isActive }) => navigationClass(isActive)}
                  end={item.end}
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
            className={({ isActive }) => navigationClass(isActive)}
            to={statePatternsPath}
          >
            <FlaskConical aria-hidden="true" className="size-5" />
            State patterns
          </NavLink>
        </nav>
        <div className="border-t p-4">
          <div className="rounded-xl border bg-muted/55 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Demo experience
            </p>
            <p className="mt-0.5 text-sm font-semibold">{roleLabel}</p>
          </div>
          <Button
            asChild
            className="mt-3 w-full justify-start"
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
        <header className="sticky top-0 z-20 border-b bg-card lg:hidden">
          <div className="flex min-h-16 items-center gap-3 px-4">
            <AppLogo compact />
            <div className="min-w-0 flex-1 py-1">
              <p className="text-sm font-bold leading-tight">BLS Companion</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                <span className="shrink-0">{roleLabel} prototype</span>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium">
                  Demo data
                </span>
              </div>
            </div>
            <Button
              asChild
              aria-label={`Open ${roleLabel.toLowerCase()} profile`}
              size="icon"
              variant="ghost"
            >
              <Link to={profilePath}>
                <UserRound aria-hidden="true" className="size-5" />
              </Link>
            </Button>
          </div>
        </header>

        <main
          className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-8 lg:px-8 lg:pb-12"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      <nav
        aria-label={`Mobile ${navigationLabel.toLowerCase()}`}
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t bg-card px-1 pt-1 shadow-[0_-4px_16px_rgb(15_23_42/0.06)] lg:hidden"
      >
        <div
          className="mx-auto grid max-w-xl"
          style={{
            gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))`,
          }}
        >
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[0.72rem] font-semibold transition-colors",
                    isActive
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                <Icon aria-hidden="true" className="size-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
