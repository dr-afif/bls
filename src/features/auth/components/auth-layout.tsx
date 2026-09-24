import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { AppLogo } from "../../../components/common/app-logo";
import { LanguageSwitcher } from "../../../components/common/language-switcher";
import { useTranslation } from "../../../lib/i18n/use-translation";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

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
              {t("auth.layout.tagline")}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t("auth.layout.description")}
            </p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary/15 bg-card p-4 text-sm">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <p>
                {t("auth.layout.securityNote")}
              </p>
            </div>
          </div>
        </section>
        <section className="flex min-h-dvh flex-col px-4 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <div className="lg:hidden">
              <AppLogo compact />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
                to="/demo"
              >
                {t("auth.layout.viewDemo")}
              </Link>
            </div>
          </div>
          <div className="my-auto w-full py-10">{children}</div>
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.layout.footer")}
          </p>
        </section>
      </div>
    </main>
  );
}
