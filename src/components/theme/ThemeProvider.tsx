import React, { createContext, useContext } from 'react';
import { useTheme, UseThemeReturn } from '@/hooks/useTheme';

const ThemeContext = createContext<UseThemeReturn | undefined>(undefined);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  initialDarkMode?: boolean;
}> = ({ children, initialDarkMode }) => {
  const theme = useTheme(initialDarkMode);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): UseThemeReturn => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
