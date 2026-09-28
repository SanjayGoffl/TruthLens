import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
export default function ThemeToggle({ light }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="btn btn-ghost d-inline-flex align-items-center justify-content-center p-2"
      style={{ width: 40, height: 40, borderRadius: 10 }}
    >
      {isDark ? <Sun size={18} color={light ? '#fff' : undefined} /> : <Moon size={18} />}
    </button>
  );
}
