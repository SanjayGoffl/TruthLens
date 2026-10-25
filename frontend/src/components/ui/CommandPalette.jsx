import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, Bookmark, FileText, Flag, GitCompare, Globe, HelpCircle, History,
  Home, Info, LayoutDashboard, LogIn, Moon, Search, Settings, ShieldCheck, Sparkles,
  Sun, Target, UserPlus, Users
} from 'lucide-react';
import Dialog from './Dialog';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { goSection } from '../../utils/scroll';

const OPEN_EVENT = 'ng:open-command';

/** Opens the command palette from anywhere: `openCommandPalette()`. */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

const SECTIONS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'how-it-works', label: 'How it works', icon: Sparkles },
  { id: 'features', label: 'Features', icon: Target },
  { id: 'credibility', label: 'Credibility scale', icon: ShieldCheck },
  { id: 'about', label: 'About', icon: Info },
  { id: 'faq', label: 'FAQ', icon: HelpCircle }
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const groups = useMemo(() => {
    const isAdmin = user?.role === 'ADMIN';
    const sections = {
      label: 'On this page',
      items: SECTIONS.map((s) => ({
        key: `section-${s.id}`,
        label: s.label,
        hint: 'Section',
        icon: s.icon,
        run: () => {
          if (location.pathname === '/') goSection(s.id);
          else navigate(`/#${s.id}`);
        }
      }))
    };
    const workspace = {
      label: user ? 'Your workspace' : 'Get started',
      items: user
        ? [
            { key: 'dash', label: isAdmin ? 'Admin dashboard' : 'My dashboard', hint: 'Page', icon: LayoutDashboard, run: () => navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard') },
            ...(isAdmin
              ? [
                  { key: 'users', label: 'Users', hint: 'Admin', icon: Users, run: () => navigate('/admin/users') },
                  { key: 'articles', label: 'Articles', hint: 'Admin', icon: FileText, run: () => navigate('/admin/articles') },
                  { key: 'flagged', label: 'Flagged articles', hint: 'Admin', icon: Flag, run: () => navigate('/admin/flagged') },
                  { key: 'analytics', label: 'Analytics', hint: 'Admin', icon: BarChart3, run: () => navigate('/admin/analytics') }
                ]
              : [
                  { key: 'analyze', label: 'Analyze an article', hint: 'Action', icon: Search, run: () => navigate('/user/analyze') },
                  { key: 'history', label: 'Analysis history', hint: 'Page', icon: History, run: () => navigate('/user/history') },
                  { key: 'compare', label: 'Compare reports', hint: 'Page', icon: GitCompare, run: () => navigate('/user/compare') },
                  { key: 'reports', label: 'Saved reports', hint: 'Page', icon: Bookmark, run: () => navigate('/user/reports') }
                ]),
            { key: 'sources', label: 'Source explorer', hint: 'Page', icon: Globe, run: () => navigate(isAdmin ? '/admin/sources' : '/user/sources') },
            { key: 'notifications', label: 'Notifications', hint: 'Page', icon: Bell, run: () => navigate(isAdmin ? '/admin/notifications' : '/user/notifications') },
            { key: 'settings', label: 'Settings', hint: 'Page', icon: Settings, run: () => navigate('/user/settings') }
          ]
        : [
            { key: 'login', label: 'Log in', hint: 'Account', icon: LogIn, run: () => navigate('/login') },
            { key: 'signup', label: 'Create an account', hint: 'Account', icon: UserPlus, run: () => navigate('/register') }
          ]
    };
    const appearance = {
      label: 'Appearance',
      items: [
        {
          key: 'theme',
          label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
          hint: 'Theme',
          icon: theme === 'dark' ? Sun : Moon,
          run: toggleTheme
        }
      ]
    };
    const q = query.trim().toLowerCase();
    const filtered = [sections, workspace, appearance]
      .map((g) => ({ ...g, items: g.items.filter((it) => !q || it.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
    return filtered;
  }, [user, theme, query, location.pathname, navigate, toggleTheme]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const clamped = Math.min(active, Math.max(flat.length - 1, 0));

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [clamped, groups.length]);

  const close = () => setOpen(false);
  const choose = (item) => {
    close();
    window.setTimeout(() => item.run(), 10);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[clamped]) choose(flat[clamped]);
    }
  };

  let cursor = -1;
  return (
    <Dialog open={open} onClose={close} label="Command palette" maxWidth={560} align="start" focusPanel={false} className="cmdk-panel">
      <div className="cmdk-input-row">
        <Search size={17} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search pages, sections and actions…"
          aria-label="Search commands"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          aria-autocomplete="list"
          aria-activedescendant={flat[clamped] ? `cmdk-opt-${flat[clamped].key}` : undefined}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
        {flat.length === 0 ? (
          <div className="cmdk-empty">No matches for “{query}”.</div>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className="cmdk-group-label">{group.label}</div>
              {group.items.map((item) => {
                cursor += 1;
                const index = cursor;
                const isActive = index === clamped;
                return (
                  <button
                    key={item.key}
                    id={`cmdk-opt-${item.key}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    className={`cmdk-item${isActive ? ' is-active' : ''}`}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(item)}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                    <span className="cmdk-hint">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className="cmdk-footer">
        <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
        <span><kbd>↵</kbd> to open</span>
        <span className="ms-auto"><kbd>Ctrl</kbd> <kbd>K</kbd> to toggle</span>
      </div>
    </Dialog>
  );
}
