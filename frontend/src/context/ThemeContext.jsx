import { createContext, useContext, useEffect, useMemo, useState } from 'react';
const ThemeContext = createContext(null);
const KEY = 'newsguard_theme';
function initialTheme() {
  const stored = localStorage.getItem(KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);
  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    setTheme
  }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
