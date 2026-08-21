/**
 * Complete theme configuration for admin dashboard with full dark mode support
 */

const lightPalette = {
  // Primary
  primary: '#2563EB', // Blue
  primaryLight: '#DBEAFE',
  primaryDark: '#1E40AF',

  // Surface
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceHover: '#F3F4F6',

  // Text
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#065F46',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#7F1D1D',

  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#1E40AF',

  // Special
  disabled: '#9CA3AF',
  placeholder: '#D1D5DB',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

const darkPalette = {
  // Primary (same across themes)
  primary: '#60A5FA', // Lighter blue for dark mode
  primaryLight: '#1E3A8A',
  primaryDark: '#93C5FD',

  // Surface
  background: '#111827',
  surface: '#1F2937',
  surfaceHover: '#374151',

  // Text
  text: '#F3F4F6',
  textSecondary: '#E5E7EB',
  textMuted: '#9CA3AF',
  textInverse: '#111827',

  // Borders & Dividers
  border: '#374151',
  borderLight: '#1F2937',
  borderDark: '#4B5563',

  // Status Colors
  success: '#10B981',
  successLight: '#065F46',
  successDark: '#D1FAE5',

  warning: '#FBBF24',
  warningLight: '#78350F',
  warningDark: '#FEF3C7',

  error: '#F87171',
  errorLight: '#7F1D1D',
  errorDark: '#FEE2E2',

  info: '#60A5FA',
  infoLight: '#1E3A8A',
  infoDark: '#DBEAFE',

  // Special
  disabled: '#6B7280',
  placeholder: '#4B5563',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

export const theme = {
  light: lightPalette,
  dark: darkPalette,
};

export type ThemePalette = typeof lightPalette;

/**
 * Get theme colors based on current mode
 */
export const getTheme = (isDark: boolean): ThemePalette => {
  return isDark ? theme.dark : theme.light;
};

/**
 * CSS color variables that can be injected into document
 */
export const getCSSVariables = (isDark: boolean) => {
  const palette = getTheme(isDark);
  return `
    :root {
      --color-primary: ${palette.primary};
      --color-primary-light: ${palette.primaryLight};
      --color-primary-dark: ${palette.primaryDark};

      --color-background: ${palette.background};
      --color-surface: ${palette.surface};
      --color-surface-hover: ${palette.surfaceHover};

      --color-text: ${palette.text};
      --color-text-secondary: ${palette.textSecondary};
      --color-text-muted: ${palette.textMuted};
      --color-text-inverse: ${palette.textInverse};

      --color-border: ${palette.border};
      --color-border-light: ${palette.borderLight};
      --color-border-dark: ${palette.borderDark};

      --color-success: ${palette.success};
      --color-success-light: ${palette.successLight};
      --color-success-dark: ${palette.successDark};

      --color-warning: ${palette.warning};
      --color-warning-light: ${palette.warningLight};
      --color-warning-dark: ${palette.warningDark};

      --color-error: ${palette.error};
      --color-error-light: ${palette.errorLight};
      --color-error-dark: ${palette.errorDark};

      --color-info: ${palette.info};
      --color-info-light: ${palette.infoLight};
      --color-info-dark: ${palette.infoDark};

      --color-disabled: ${palette.disabled};
      --color-placeholder: ${palette.placeholder};
      --color-overlay: ${palette.overlay};
    }
  `;
};

/**
 * Tailwind-compatible theme object for Material-UI or similar
 */
export const tailwindTheme = {
  light: {
    colors: {
      primary: lightPalette.primary,
      'primary-light': lightPalette.primaryLight,
      'primary-dark': lightPalette.primaryDark,
      background: lightPalette.background,
      surface: lightPalette.surface,
      text: lightPalette.text,
      border: lightPalette.border,
      success: lightPalette.success,
      warning: lightPalette.warning,
      error: lightPalette.error,
    },
  },
  dark: {
    colors: {
      primary: darkPalette.primary,
      'primary-light': darkPalette.primaryLight,
      'primary-dark': darkPalette.primaryDark,
      background: darkPalette.background,
      surface: darkPalette.surface,
      text: darkPalette.text,
      border: darkPalette.border,
      success: darkPalette.success,
      warning: darkPalette.warning,
      error: darkPalette.error,
    },
  },
};
