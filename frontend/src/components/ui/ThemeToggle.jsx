import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './shadcn/tooltip';

export default function ThemeToggle({ light }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={label}
          className="btn btn-ghost d-inline-flex align-items-center justify-content-center p-2"
          style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'sun' : 'moon'}
              className="d-inline-flex"
              initial={{ rotate: -70, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 70, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {isDark ? <Sun size={18} color={light ? '#fff' : undefined} /> : <Moon size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
