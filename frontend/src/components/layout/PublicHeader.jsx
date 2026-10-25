import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Command as CommandIcon, LayoutDashboard, LogOut, Menu,
  Search, User as UserIcon, X
} from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { openCommandPalette } from '../ui/CommandPalette';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger
} from '../ui/shadcn/dropdown-menu';
import { useAuth } from '../../context/AuthContext';
import { classNames, initials } from '../../utils/credibility';

const NAV = [
  { label: 'Home', section: null },
  { label: 'How It Works', section: 'how-it-works' },
  { label: 'Features', section: 'features' },
  { label: 'Credibility', section: 'credibility' },
  { label: 'About', section: 'about' },
  { label: 'FAQ', section: 'faq' }
];

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveId(null);
      return undefined;
    }
    const els = NAV.filter((n) => n.section)
      .map((n) => document.getElementById(n.section))
      .filter(Boolean);
    if (!els.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.2, 0.5] }
    );
    els.forEach((el) => observer.observe(el));
    const onScroll = () => {
      if (window.scrollY < 220) setActiveId('home');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.pathname]);

  const activeSection = location.pathname === '/' ? (activeId === 'home' || !activeId ? 'Home' : activeId) : null;
  const dashboardPath = user?.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard';

  return (
    <header className={classNames('position-sticky site-header', scrolled && 'is-scrolled')} style={{ top: 0, zIndex: 60, background: 'var(--bg)', borderBottom: '1px solid var(--border)', height: 'var(--header-h)' }}>
      <div className="d-flex align-items-center justify-content-between px-3 px-lg-4" style={{ height: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <Logo />
        <nav className="d-none d-lg-flex align-items-center gap-1" aria-label="Main navigation">
          {NAV.map((item) =>
            item.section ? (
              <Link
                key={item.label}
                to={`/#${item.section}`}
                className={classNames('btn btn-sm border-0 fw-semibold nav-link-ng', activeSection === item.section && 'is-active')}
                style={{ background: 'transparent', padding: '0.45rem 0.8rem' }}
              >
                {item.label}
              </Link>
            ) : (
              <Link key={item.label} to="/" className={classNames('btn btn-sm border-0 fw-semibold nav-link-ng', activeSection === 'Home' && 'is-active')} style={{ background: 'transparent', padding: '0.45rem 0.8rem' }}>
                {item.label}
              </Link>
            )
          )}
        </nav>
        <div className="d-flex align-items-center gap-2">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="btn btn-ghost account-trigger d-none d-sm-inline-flex align-items-center gap-2 py-1 pe-2 ps-1"
                  aria-label="Account menu"
                >
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="avatar avatar-sm" />
                  ) : (
                    <span className="avatar avatar-sm" aria-hidden="true">{initials(user.name)}</span>
                  )}
                  <span className="fw-semibold text-main d-none d-xl-inline" style={{ fontSize: 13.5 }}>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-muted-2 account-chevron" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="tw-w-[248px]">
                <DropdownMenuLabel className="tw-pb-2">
                  <span className="tw-block tw-text-[13.5px] tw-font-bold tw-text-foreground">{user.name}</span>
                  <span className="tw-block tw-truncate tw-text-[11.5px] tw-font-normal tw-text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={dashboardPath}>
                    <LayoutDashboard />
                    {user.role === 'ADMIN' ? 'Admin Dashboard' : 'My Dashboard'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/user/settings">
                    <UserIcon />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.setTimeout(openCommandPalette, 10)}>
                  <CommandIcon />
                  Command Palette
                  <DropdownMenuShortcut>{isMac ? '⌘K' : 'Ctrl K'}</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="tw-text-destructive focus:tw-text-destructive" onSelect={() => logout()}>
                  <LogOut />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="d-none d-sm-flex align-items-center gap-2">
              <Link to="/login" className="btn btn-ghost">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm px-3">Sign Up</Link>
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost d-lg-none p-2"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="public-mobile-nav"
            style={{ width: 40, height: 40 }}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="d-lg-none card rounded-0 border-0 border-top mobile-nav-panel" id="public-mobile-nav" style={{ position: 'absolute', insetInline: 0, background: 'var(--card)' }}>
          <nav className="p-2 d-flex flex-column" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <Link key={item.label} to={item.section ? `/#${item.section}` : '/'} className="btn btn-ghost text-start justify-content-between" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="btn btn-ghost text-start d-flex align-items-center gap-2"
              onClick={() => {
                setOpen(false);
                openCommandPalette();
              }}
            >
              <Search size={16} />
              Search Commands
            </button>
            <hr className="divider mx-3" />
            {user ? (
              <>
                <Link to={dashboardPath} className="btn btn-ghost text-start">Dashboard</Link>
                <Link to="/user/settings" className="btn btn-ghost text-start">Settings</Link>
                <button type="button" className="btn btn-ghost text-start text-danger" onClick={() => logout()}>Log Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost text-start" onClick={() => setOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn btn-primary text-start" onClick={() => setOpen(false)}>Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
