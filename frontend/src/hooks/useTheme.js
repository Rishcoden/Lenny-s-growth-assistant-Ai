import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('lenny_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('lenny_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.style.colorScheme = newTheme;
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}

export default useTheme;
