import { useState, useEffect } from 'react';
import { getTheme, ThemePalette } from '@/constants/theme';

export const useTheme = (initialDarkMode?: boolean) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (initialDarkMode !== undefined) return initialDarkMode;

    // Check localStorage for user preference
    const stored = localStorage.getItem('admin-dark-mode');
    if (stored !== null) return stored === 'true';

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    return false;
  });

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('admin-dark-mode', isDarkMode.toString());

    // Apply theme to document
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    // Apply CSS variables
    const palette = getTheme(isDarkMode);
    const vars = {
      '--color-primary': palette.primary,
      '--color-primary-light': palette.primaryLight,
      '--color-primary-dark': palette.primaryDark,
      '--color-background': palette.background,
      '--color-surface': palette.surface,
      '--color-surface-hover': palette.surfaceHover,
      '--color-text': palette.text,
      '--color-text-secondary': palette.textSecondary,
      '--color-text-muted': palette.textMuted,
      '--color-text-inverse': palette.textInverse,
      '--color-border': palette.border,
      '--color-border-light': palette.borderLight,
      '--color-border-dark': palette.borderDark,
      '--color-success': palette.success,
      '--color-success-light': palette.successLight,
      '--color-success-dark': palette.successDark,
      '--color-warning': palette.warning,
      '--color-warning-light': palette.warningLight,
      '--color-warning-dark': palette.warningDark,
      '--color-error': palette.error,
      '--color-error-light': palette.errorLight,
      '--color-error-dark': palette.errorDark,
      '--color-info': palette.info,
      '--color-info-light': palette.infoLight,
      '--color-info-dark': palette.infoDark,
      '--color-disabled': palette.disabled,
      '--color-placeholder': palette.placeholder,
    };

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [isDarkMode]);

  const colors = getTheme(isDarkMode);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return {
    isDarkMode,
    colors,
    toggleTheme,
    setIsDarkMode,
  };
};

export type UseThemeReturn = ReturnType<typeof useTheme>;
