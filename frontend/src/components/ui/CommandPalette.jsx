import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowUp, BarChart3, Bell, Bookmark, BookOpenCheck, CircleHelp, Clock3,
  CornerDownLeft, FileText, Flag, GitCompare, Globe,
  House, Layers, LayoutDashboard, LogIn, Moon, Scale, SearchX, Settings,
  ShieldCheck, Sun, UserPlus, Users, Waypoints
} from 'lucide-react';
import Dialog from './Dialog';
import Icon from './Icon';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandShortcut
} from './shadcn/command';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { goSection } from '../../utils/scroll';

const OPEN_EVENT = 'ng:open-command';
const RECENT_KEY = 'ng_cmdk_recents';

/** Opens the command palette from anywhere: `openCommandPalette()`. */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

const SECTIONS = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'how-it-works', label: 'How It Works', icon: Waypoints },
  { id: 'features', label: 'Features', icon: Layers },
  { id: 'credibility', label: 'Credibility Scale', icon: Scale },
  { id: 'about', label: 'About', icon: BookOpenCheck },
  { id: 'faq', label: 'FAQ', icon: CircleHelp }
];

function readRecents() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((key) => typeof key === 'string').slice(0, 4) : [];
  } catch {
    return [];
  }
}

/**
 * Fuzzy scorer adapted from the 21st.dev command palette: exact and prefix
 * matches win, then word-boundary hits, then subsequence matches with a
 * streak bonus so contiguous letters rank higher.
 */
function scoreOne(query, target) {
  if (!query) return 1;
  const text = String(target || '').toLowerCase();
  if (!text) return 0;
  if (text === query) return 1000;

  const direct = text.indexOf(query);
  if (direct === 0) return 900 - Math.min(text.length, 40);
  if (direct > 0) {
    const boundary = /[\s\-_/.:]/.test(text[direct - 1]);
    return (boundary ? 760 : 620) - direct * 3 - Math.min(text.length - query.length, 40);
  }

  let cursor = 0;
  let score = 0;
  let streak = 0;
  for (const char of query) {
    const at = text.indexOf(char, cursor);
    if (at === -1) return 0;
    const gap = at - cursor;
    streak = gap === 0 ? streak + 1 : 0;
    score += 12 + streak * 8 - Math.min(gap, 5) * 2;
    cursor = at + 1;
  }
  return Math.max(1, score);
}

function scoreItem(query, item) {
  const labelScore = scoreOne(query, item.label);
  const metaScore = scoreOne(query, `${item.keywords || ''} ${item.hint || ''}`) * 0.55;
  return Math.max(labelScore, metaScore);
}

function rank(items, query) {
  return items
    .map((item, index) => ({ item, index, score: scoreItem(query, item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [session, setSession] = useState(0);
  const [recents, setRecents] = useState(readRecents);
  const inputRef = useRef(null);
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
    if (!open) return undefined;
    setQuery('');
    setSession((value) => value + 1);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const groups = useMemo(() => {
    const isAdmin = user?.role === 'ADMIN';
    return [
      {
        key: 'sections',
        label: 'On This Page',
        items: SECTIONS.map((section) => ({
          key: `section-${section.id}`,
          label: section.label,
          hint: 'Section',
          keywords: `jump scroll ${section.id}`,
          icon: section.icon,
          run: () => {
            if (location.pathname === '/') goSection(section.id);
            else navigate(`/#${section.id}`);
          }
        }))
      },
      {
        key: 'workspace',
        label: user ? 'Your Workspace' : 'Get Started',
        items: user
          ? [
              {
                key: 'dash',
                label: isAdmin ? 'Admin Dashboard' : 'My Dashboard',
                hint: 'Page',
                keywords: 'home overview',
                icon: LayoutDashboard,
                run: () => navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard')
              },
              ...(isAdmin
                ? [
                    { key: 'users', label: 'Users', hint: 'Admin', keywords: 'people accounts', icon: Users, run: () => navigate('/admin/users') },
                    { key: 'articles', label: 'Articles', hint: 'Admin', keywords: 'content news', icon: FileText, run: () => navigate('/admin/articles') },
                    { key: 'flagged', label: 'Flagged Articles', hint: 'Admin', keywords: 'review moderation', icon: Flag, run: () => navigate('/admin/flagged') },
                    { key: 'analytics', label: 'Analytics', hint: 'Admin', keywords: 'charts stats metrics', icon: BarChart3, run: () => navigate('/admin/analytics') }
                  ]
                : [
                    { key: 'analyze', label: 'Analyze an Article', hint: 'Action', keywords: 'scan check verify', icon: ShieldCheck, run: () => navigate('/user/analyze') },
                    { key: 'history', label: 'Analysis History', hint: 'Page', keywords: 'past previous', icon: Clock3, run: () => navigate('/user/history') },
                    { key: 'compare', label: 'Compare Reports', hint: 'Page', keywords: 'diff side by side', icon: GitCompare, run: () => navigate('/user/compare') },
                    { key: 'reports', label: 'Saved Reports', hint: 'Page', keywords: 'bookmarks saved', icon: Bookmark, run: () => navigate('/user/reports') }
                  ]),
              { key: 'sources', label: 'Source Explorer', hint: 'Page', keywords: 'domains publishers', icon: Globe, run: () => navigate(isAdmin ? '/admin/sources' : '/user/sources') },
              { key: 'notifications', label: 'Notifications', hint: 'Page', keywords: 'alerts inbox', icon: Bell, run: () => navigate(isAdmin ? '/admin/notifications' : '/user/notifications') },
              { key: 'settings', label: 'Settings', hint: 'Page', keywords: 'profile preferences account', icon: Settings, run: () => navigate('/user/settings') }
            ]
          : [
              { key: 'login', label: 'Sign In', hint: 'Account', keywords: 'log in', icon: LogIn, run: () => navigate('/login') },
              { key: 'signup', label: 'Sign Up', hint: 'Account', keywords: 'register create account', icon: UserPlus, run: () => navigate('/register') }
            ]
      },
      {
        key: 'appearance',
        label: 'Appearance',
        items: [
          {
            key: 'theme',
            label: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
            hint: 'Theme',
            keywords: 'dark light mode appearance',
            icon: theme === 'dark' ? Sun : Moon,
            run: toggleTheme
          }
        ]
      }
    ];
  }, [user, theme, location.pathname, navigate, toggleTheme]);

  const recentItems = useMemo(() => {
    if (query.trim()) return [];
    const byKey = new Map(groups.flatMap((group) => group.items.map((item) => [item.key, item])));
    return recents.map((key) => byKey.get(key)).filter(Boolean);
  }, [groups, recents, query]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const hidden = new Set(recentItems.map((item) => item.key));
      return groups
        .map((group) => ({ ...group, items: group.items.filter((item) => !hidden.has(item.key)) }))
        .filter((group) => group.items.length);
    }
    return groups
      .map((group) => {
        const items = rank(group.items, q);
        const score = items.length ? Math.max(...items.map((item) => scoreItem(q, item))) : 0;
        return { ...group, items, score };
      })
      .filter((group) => group.items.length)
      .sort((a, b) => b.score - a.score);
  }, [groups, query, recentItems]);

  const visibleGroups = recentItems.length
    ? [{ key: 'recent', label: 'Recent', items: recentItems }, ...filteredGroups]
    : filteredGroups;

  const count = visibleGroups.reduce((total, group) => total + group.items.length, 0);

  const close = () => setOpen(false);

  const choose = (item) => {
    const next = [item.key, ...recents.filter((key) => key !== item.key)].slice(0, 4);
    setRecents(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage is optional */
    }
    close();
    window.setTimeout(() => item.run(), 10);
  };

  return (
    <Dialog open={open} onClose={close} label="Command palette" maxWidth={580} align="start" focusPanel={false} className="cmdk-panel">
      <Command key={session} shouldFilter={false} loop label="Command palette" className="cmdk-command">
        <CommandInput
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder="Search pages, sections and actions…"
          aria-label="Search commands"
        />
        <CommandList className="cmdk-list">
          <CommandEmpty className="cmdk-empty">
            <SearchX size={26} className="tw-mx-auto tw-mb-2 tw-text-muted-foreground" />
            <span className="tw-block tw-font-semibold tw-text-foreground">No matches for “{query}”</span>
            <span className="tw-mt-1 tw-block tw-text-xs">Try “sign”, “theme” or “features”.</span>
          </CommandEmpty>
          {visibleGroups.map((group) => (
            <CommandGroup key={group.key} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem key={item.key} value={item.key} onSelect={() => choose(item)}>
                  <Icon icon={item.icon} size={16} />
                  <span className="tw-truncate">{item.label}</span>
                  <CommandShortcut>{item.hint}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="cmdk-footer">
          <span className="d-inline-flex align-items-center gap-1">
            <kbd><ArrowUp size={10} /></kbd><kbd><ArrowDown size={10} /></kbd> navigate
          </span>
          <span className="d-inline-flex align-items-center gap-1"><kbd><CornerDownLeft size={10} /></kbd> open</span>
          <span className="d-inline-flex align-items-center gap-1"><kbd>esc</kbd> close</span>
          <span className="ms-auto" aria-live="polite">
            {count} {count === 1 ? 'result' : 'results'}
          </span>
        </div>
      </Command>
    </Dialog>
  );
}
