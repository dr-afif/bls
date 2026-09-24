import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from './language-switcher';
import * as useTranslationModule from '../../lib/i18n/use-translation';

describe('LanguageSwitcher', () => {
  const mockSetLocale = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders accessible group with English and Bahasa Melayu buttons', () => {
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => {
        if (key === 'language.label') return 'Language';
        if (key === 'language.english') return 'English';
        if (key === 'language.malay') return 'Bahasa Melayu';
        return key;
      },
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const group = screen.getByRole('group', { name: 'Language' });
    expect(group).toBeInTheDocument();

    const enButton = screen.getByRole('button', { name: 'English' });
    const msButton = screen.getByRole('button', { name: 'Bahasa Melayu' });

    expect(enButton).toBeInTheDocument();
    expect(msButton).toBeInTheDocument();
    expect(enButton).toHaveAttribute('aria-pressed', 'true');
    expect(msButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls setLocale when selecting Bahasa Melayu', async () => {
    const user = userEvent.setup();
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => {
        if (key === 'language.label') return 'Language';
        if (key === 'language.english') return 'English';
        if (key === 'language.malay') return 'Bahasa Melayu';
        return key;
      },
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const msButton = screen.getByRole('button', { name: 'Bahasa Melayu' });
    await user.click(msButton);

    expect(mockSetLocale).toHaveBeenCalledWith('ms');
  });

  it('supports keyboard navigation via Enter key', async () => {
    const user = userEvent.setup();
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => {
        if (key === 'language.label') return 'Language';
        if (key === 'language.english') return 'English';
        if (key === 'language.malay') return 'Bahasa Melayu';
        return key;
      },
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const msButton = screen.getByRole('button', { name: 'Bahasa Melayu' });
    msButton.focus();
    await user.keyboard('{Enter}');

    expect(mockSetLocale).toHaveBeenCalledWith('ms');
  });

  it('disables buttons when updating preference is in flight', () => {
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => {
        if (key === 'language.label') return 'Language';
        if (key === 'language.english') return 'English';
        if (key === 'language.malay') return 'Bahasa Melayu';
        return key;
      },
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: true,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    expect(screen.getByRole('button', { name: 'English' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Bahasa Melayu' })).toBeDisabled();
  });

  it('displays accessible alert when preferenceError is present', () => {
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => {
        if (key === 'language.label') return 'Language';
        if (key === 'language.english') return 'English';
        if (key === 'language.malay') return 'Bahasa Melayu';
        if (key === 'profile.languageUpdateFailed') return 'Unable to save language preference.';
        return key;
      },
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: 'profile.languageUpdateFailed',
    });

    render(<LanguageSwitcher />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Unable to save language preference.');
  });
});
