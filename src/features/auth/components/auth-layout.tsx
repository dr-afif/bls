import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-7xl lg:grid-cols-[1fr_32rem]">
        <section className="hidden bg-primary-soft/60 px-12 py-10 lg:flex lg:flex-col">
          <AppLogo />
          <div className="my-auto max-w-xl py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              BLS Course Companion
            </p>
            <p className="mt-4 text-4xl font-bold tracking-tight">
              Practical support for physical Basic Life Support courses.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Secure account access is being introduced before protected course
              resources and assessments. Your organization must invite you.
            </p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/15 bg-card p-4 text-sm">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>
                Account and role checks are backed by Supabase. The learning
                content remains prototype-only until later milestones.
              </p>
            </div>
          </div>
        </section>
        <section className="flex min-h-dvh flex-col px-4 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <div className="lg:hidden">
              <AppLogo compact />
            </div>
            <Link
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
              to="/demo"
            >
              View demo
            </Link>
          </div>
          <div className="my-auto w-full py-10">{children}</div>
          <p className="text-center text-xs text-muted-foreground">
            Production account foundation · Prototype learning content
          </p>
        </section>
      </div>
    </main>
  );
}
