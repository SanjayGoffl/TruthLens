import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Activity, AlertTriangle, BarChart3, GitCompare, Bell, Bookmark, ChevronDown, FileText, Flag, Globe, History,
  LayoutDashboard, LogOut, Menu, Search, Settings, ShieldAlert, Users, X
} from 'lucide-react';
import Logo from '../ui/Logo';
import InstallApp from '../ui/InstallApp';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { classNames, initials } from '../../utils/credibility';
import { onSocketEvent, offSocketEvent } from '../../services/socket';
import { permissionState, showBrowserNotification } from '../../utils/browserNotify';
const USER_NAV = [
  { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/user/analyze', label: 'Analyze Article', icon: Search },
  { to: '/user/history', label: 'Analysis History', icon: History },
  { to: '/user/compare', label: 'Compare Reports', icon: GitCompare },
  { to: '/user/reports', label: 'Saved Reports', icon: Bookmark },
  { to: '/user/sources', label: 'Source Explorer', icon: Globe },
  { to: '/user/notifications', label: 'Notifications', icon: Bell },
  { to: '/user/settings', label: 'Settings', icon: Settings }
];
const BOTTOM_NAV = [
  { to: '/user/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/user/analyze', label: 'Analyze', icon: Search },
  { to: '/user/history', label: 'History', icon: History },
  { to: '/user/sources', label: 'Sources', icon: Globe },
  { to: '/user/settings', label: 'Settings', icon: Settings }
];
const recentAlerts = new Map(); // key -> timestamp (ms)
const ALERT_DEDUPE_MS = 6000;
function rememberAlert(key) {
  const now = Date.now();
  for (const [k, t] of recentAlerts) {
    if (now - t > ALERT_DEDUPE_MS) recentAlerts.delete(k);
  }
  if (recentAlerts.has(key) && now - recentAlerts.get(key) < ALERT_DEDUPE_MS) return false;
  recentAlerts.set(key, now);
  return true;
}
const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/sources', label: 'Sources', icon: Globe },
  { to: '/admin/articles', label: 'Articles', icon: FileText },
  { to: '/admin/flagged', label: 'Flagged Articles', icon: Flag },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings }
];
function SidebarContent({ role, user, logout, onNavigate }) {
  const nav = role === 'ADMIN' ? ADMIN_NAV : USER_NAV;
  return (
    <div className="d-flex flex-column h-100" style={{ padding: '1.15rem 0.9rem' }}>
      <div className="px-2 pb-3">
        <Logo onClick={onNavigate} />
      </div>
      <div className="d-flex align-items-center gap-2 card p-2 mb-3" style={{ borderRadius: 12 }}>
        {user.profileImage ? (
          <img src={user.profileImage} alt="" className="avatar avatar-sm" />
        ) : (
          <span className="avatar avatar-sm" aria-hidden="true">{initials(user.name)}</span>
        )}
        <div className="min-w-0">
          <div className="fw-bold text-main text-truncate" style={{ fontSize: 13 }}>{user.name}</div>
          <div className="text-muted-2" style={{ fontSize: 11 }}>{role === 'ADMIN' ? 'Administrator' : 'Member'}</div>
        </div>
      </div>
      <nav className="d-flex flex-column gap-1 flex-grow-1 overflow-auto" aria-label={`${role} navigation`} style={{ minHeight: 0 }}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              classNames('nav-item-ng d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-semibold', isActive ? 'active' : '')
            }
            style={{ fontSize: 14 }}
          >
            <item.icon size={17} strokeWidth={2.2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-3">
        <button type="button" onClick={logout} className="btn w-100 d-flex align-items-center justify-content-center gap-2 text-danger" style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)' }}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
export default function DashboardLayout({ role, children }) {
  const { user, logout, refreshProfile, stats } = useAuth();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const onSocket = useCallback(
    (payload) => {
      if (!payload || !payload.code || !payload.title) return;
      const key = `${payload.code}:${payload.title}:${payload.message}`;
      if (!rememberAlert(key)) return;
      const color = payload.level === 'success' ? '#4F46E5' : payload.level === 'error' ? '#DC2626' : payload.level === 'warning' ? '#D97706' : '#6366F1';
      const Icon = payload.type === 'flagged' ? ShieldAlert : payload.type === 'report' ? FileText : payload.type === 'security' ? ShieldAlert : payload.type === 'user' ? Users : payload.type === 'alert' ? AlertTriangle : Activity;
      const go = () => {
        toast.dismiss();
        if (payload.link && payload.link.startsWith('/')) navigate(payload.link);
      };
      toast.custom(
        (t) => (
          <div
            onClick={go}
            className="d-flex align-items-start gap-2 px-3 py-2 rounded-3 shadow"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, maxWidth: 380, cursor: 'pointer' }}
          >
            <span className="mt-1 flex-shrink-0" style={{ color }}>
              <Icon size={17} />
            </span>
            <span className="d-grid">
              <span className="fw-bold text-main text-truncate" style={{ fontSize: 13.5 }}>{payload.title}</span>
              <span className="text-muted-2" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{payload.message}</span>
            </span>
            <button type="button" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }} className="btn btn-ghost p-0 border-0 ms-1 flex-shrink-0" style={{ width: 22, height: 22 }}>
              <X size={14} />
            </button>
          </div>
        ),
        { duration: 6500, position: 'bottom-right' }
      );
      if (permissionState() === 'granted') showBrowserNotification({ title: payload.title, message: payload.message, link: payload.link });
      if (payload.persist) refreshProfile();
    },
    [refreshProfile, navigate]
  );
  useEffect(() => {
    onSocketEvent('notify', onSocket);
    const interval = setInterval(() => refreshProfile(), 60000);
    return () => {
      offSocketEvent('notify', onSocket);
      clearInterval(interval);
    };
  }, [onSocket, refreshProfile]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && drawer) setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);
  if (!user) return null;
  const doLogout = () => logout();
  const unread = (stats && stats.unreadNotifications) || 0;
  return (
    <div className="dashboard-shell">
      <aside className="position-fixed top-0 bottom-0 d-none d-lg-block sidebar-shell" style={{ width: 'var(--sidebar-w)', borderRight: '1px solid var(--border)', zIndex: 45 }}>
        <SidebarContent role={role} user={user} logout={doLogout} onNavigate={() => {}} />
      </aside>
      {drawer ? (
        <>
          <div className="sidebar-backdrop d-lg-none" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="position-fixed top-0 bottom-0 d-lg-none" style={{ width: 'min(84vw, 300px)', background: 'var(--card)', borderRight: '1px solid var(--border)', zIndex: 50 }}>
            <button type="button" className="btn btn-ghost position-absolute p-1" aria-label="Close menu" style={{ top: 10, right: 10 }} onClick={() => setDrawer(false)}>
              <X size={18} />
            </button>
            <SidebarContent role={role} user={user} logout={doLogout} onNavigate={() => setDrawer(false)} />
          </aside>
        </>
      ) : null}
      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4" style={{ minHeight: 44 }}>
            <button type="button" className="btn btn-ghost d-lg-none p-2" aria-label="Open menu" style={{ width: 40, height: 40 }} onClick={() => setDrawer(true)}>
              <Menu size={19} />
            </button>
            <div className="d-flex align-items-center gap-2 ms-auto ms-lg-0">
              <ThemeToggle />
              <button type="button" className="btn btn-ghost position-relative p-2" style={{ width: 40, height: 40 }} aria-label="Notifications" onClick={() => navigate(role === 'ADMIN' ? '/admin/notifications' : '/user/notifications')}>
                <Bell size={18} />
                {unread > 0 ? (
                  <span className="position-absolute top-0 end-0 badge rounded-pill text-white" style={{ background: 'var(--danger)', fontSize: 9.5, minWidth: 17 }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </button>
              <div className="position-relative">
                <button type="button" className="btn btn-ghost d-inline-flex align-items-center gap-2 py-1 pe-2 ps-1" aria-expanded={profileMenu} onClick={() => setProfileMenu((v) => !v)}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="avatar avatar-sm" />
                  ) : (
                    <span className="avatar avatar-sm" aria-hidden="true">{initials(user.name)}</span>
                  )}
                  <ChevronDown size={14} className="text-muted-2 d-none d-md-block" />
                </button>
                {profileMenu ? (
                  <div className="position-absolute end-0 mt-2 card p-1" style={{ width: 210, zIndex: 70 }} role="menu">
                    <div className="px-3 py-2 border-bottom d-grid">
                      <span className="fw-bold text-main text-truncate" style={{ fontSize: 13.5 }}>{user.name}</span>
                      <span className="text-muted-2 text-xs text-truncate">{user.email}</span>
                    </div>
                    <button type="button" className="dropdown-item rounded-3 py-2" onClick={() => { setProfileMenu(false); navigate('/user/settings'); }}>Settings</button>
                    <button type="button" className="dropdown-item rounded-3 py-2 text-danger" onClick={() => { setProfileMenu(false); logout(); }}>Log out</button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {role === 'USER' ? <InstallApp /> : null}
          {children}
        </div>
      </div>
      {role === 'USER' ? (
        <nav className="bottom-nav" aria-label="Quick navigation">
          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
