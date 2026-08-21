import React from 'react';
import { useThemeContext } from './ThemeProvider';
import styles from './ThemeToggle.module.css';

export const ThemeToggle: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  return (
    <button
      className={`${styles.toggle} ${className || ''}`}
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
