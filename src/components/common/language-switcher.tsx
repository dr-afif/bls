import { useTranslation } from '../../lib/i18n/use-translation';
import type { AppLocale } from '../../lib/i18n/types';
import { cn } from '../../lib/utils';

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, t, isUpdatingPreference } = useTranslation();

  const handleSelect = (newLocale: AppLocale) => {
    if (newLocale !== locale && !isUpdatingPreference) {
      void setLocale(newLocale);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={t('language.label')}
      className={cn(
        'inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 text-xs font-medium backdrop-blur-sm',
        className,
      )}
    >
      <span className="sr-only">{t('language.label')}</span>
      <button
        type="button"
        role="radio"
        aria-checked={locale === 'en'}
        aria-label="English"
        disabled={isUpdatingPreference}
        onClick={() => handleSelect('en')}
        className={cn(
          'flex min-h-[34px] min-w-[44px] items-center justify-center rounded-md px-2.5 py-1 transition-all duration-150',
          locale === 'en'
            ? 'bg-background text-foreground font-semibold shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
      >
        English
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={locale === 'ms'}
        aria-label="Bahasa Melayu"
        disabled={isUpdatingPreference}
        onClick={() => handleSelect('ms')}
        className={cn(
          'flex min-h-[34px] min-w-[44px] items-center justify-center rounded-md px-2.5 py-1 transition-all duration-150',
          locale === 'ms'
            ? 'bg-background text-foreground font-semibold shadow-xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
        )}
      >
        Bahasa Melayu
      </button>
    </div>
  );
}
