import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);
const KEY = 'newsguard_theme';

function initialTheme() {
  const stored = localStorage.getItem(KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(KEY, theme);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const changeTheme = useCallback((next) => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canAnimate = typeof document.startViewTransition === 'function' && !reduce && document.visibilityState === 'visible';
    if (!canAnimate) {
      apply(next);
      setTheme(next);
      return;
    }
    try {
      document.startViewTransition(() => {
        apply(next);
        flushSync(() => setTheme(next));
      });
    } catch {
      apply(next);
      setTheme(next);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => changeTheme(theme === 'light' ? 'dark' : 'light'),
      setTheme: changeTheme
    }),
    [theme, changeTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
