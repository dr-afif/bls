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

  it('renders accessible radiogroup with English and Bahasa Melayu buttons', () => {
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => (key === 'language.label' ? 'Language' : key),
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const group = screen.getByRole('radiogroup', { name: 'Language' });
    expect(group).toBeInTheDocument();

    const enButton = screen.getByRole('radio', { name: 'English' });
    const msButton = screen.getByRole('radio', { name: 'Bahasa Melayu' });

    expect(enButton).toBeInTheDocument();
    expect(msButton).toBeInTheDocument();
    expect(enButton).toHaveAttribute('aria-checked', 'true');
    expect(msButton).toHaveAttribute('aria-checked', 'false');
  });

  it('calls setLocale when selecting Bahasa Melayu', async () => {
    const user = userEvent.setup();
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => (key === 'language.label' ? 'Language' : key),
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const msButton = screen.getByRole('radio', { name: 'Bahasa Melayu' });
    await user.click(msButton);

    expect(mockSetLocale).toHaveBeenCalledWith('ms');
  });

  it('supports keyboard navigation via Enter key', async () => {
    const user = userEvent.setup();
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => (key === 'language.label' ? 'Language' : key),
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: false,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    const msButton = screen.getByRole('radio', { name: 'Bahasa Melayu' });
    msButton.focus();
    await user.keyboard('{Enter}');

    expect(mockSetLocale).toHaveBeenCalledWith('ms');
  });

  it('disables buttons when updating preference is in flight', () => {
    vi.spyOn(useTranslationModule, 'useTranslation').mockReturnValue({
      locale: 'en',
      setLocale: mockSetLocale,
      t: (key: string) => (key === 'language.label' ? 'Language' : key),
      formatDate: vi.fn(),
      formatDateTime: vi.fn(),
      formatNumber: vi.fn(),
      isUpdatingPreference: true,
      preferenceError: null,
    });

    render(<LanguageSwitcher />);

    expect(screen.getByRole('radio', { name: 'English' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Bahasa Melayu' })).toBeDisabled();
  });
});
