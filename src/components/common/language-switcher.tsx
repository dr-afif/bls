import { useTranslation } from '../../lib/i18n/use-translation';
import type { AppLocale } from '../../lib/i18n/types';
import { cn } from '../../lib/utils';

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, t, isUpdatingPreference, preferenceError } =
    useTranslation();

  const handleSelect = (newLocale: AppLocale) => {
    if (newLocale !== locale && !isUpdatingPreference) {
      void setLocale(newLocale);
    }
  };

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <div
        role="group"
        aria-label={t("language.label")}
        className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs font-medium backdrop-blur-sm"
      >
        <button
          type="button"
          aria-pressed={locale === "en"}
          aria-label={t("language.english")}
          disabled={isUpdatingPreference}
          onClick={() => handleSelect("en")}
          className={cn(
            "flex min-h-[34px] min-w-[44px] items-center justify-center rounded-md px-2.5 py-1 transition-all duration-150",
            locale === "en"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          )}
        >
          {t("language.english")}
        </button>
        <button
          type="button"
          aria-pressed={locale === "ms"}
          aria-label={t("language.malay")}
          disabled={isUpdatingPreference}
          onClick={() => handleSelect("ms")}
          className={cn(
            "flex min-h-[34px] min-w-[44px] items-center justify-center rounded-md px-2.5 py-1 transition-all duration-150",
            locale === "ms"
              ? "bg-background text-foreground font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          )}
        >
          {t("language.malay")}
        </button>
      </div>
      {preferenceError && (
        <p
          role="alert"
          aria-live="polite"
          className="max-w-xs text-center text-[11px] font-medium leading-tight text-destructive"
        >
          {t(preferenceError)}
        </p>
      )}
    </div>
  );
}
