import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { classNames, initials } from '../../utils/credibility';
import { goSection } from '../../utils/scroll';
const NAV = [
  { label: 'Home', section: null },
  { label: 'How It Works', section: 'how-it-works' },
  { label: 'Features', section: 'features' },
  { label: 'Credibility', section: 'credibility' },
  { label: 'About', section: 'about' },
  { label: 'FAQ', section: 'faq' }
];
export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);
  const activeSection = location.hash ? location.hash.slice(1) : location.pathname === '/' ? 'Home' : null;
  return (
    <header className="position-sticky" style={{ top: 0, zIndex: 60, background: 'var(--bg)', borderBottom: '1px solid var(--border)', height: 'var(--header-h)' }}>
      <div className="d-flex align-items-center justify-content-between px-3 px-lg-4" style={{ height: '100%', maxWidth: 1280, margin: '0 auto' }}>
        <Logo />
        <nav className="d-none d-lg-flex align-items-center gap-1" aria-label="Main navigation">
          {NAV.map((item) =>
            item.section ? (
              <button
                key={item.label}
                type="button"
                onClick={() => goSection(item.section)}
                className={classNames('btn btn-sm border-0 fw-semibold', activeSection === item.section ? 'text-main' : 'text-muted-2')}
                style={{ background: 'transparent', padding: '0.45rem 0.8rem' }}
              >
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to="/" className={classNames('btn btn-sm border-0 fw-semibold', activeSection === 'Home' ? 'text-main' : 'text-muted-2')} style={{ background: 'transparent', padding: '0.45rem 0.8rem' }}>
                {item.label}
              </Link>
            )
          )}
        </nav>
        <div className="d-flex align-items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="position-relative d-none d-sm-block">
              <button
                type="button"
                className="btn btn-ghost d-inline-flex align-items-center gap-2 py-1 pe-2 ps-1"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="avatar avatar-sm" />
                ) : (
                  <span className="avatar avatar-sm" aria-hidden="true">{initials(user.name)}</span>
                )}
                <span className="fw-semibold text-main d-none d-xl-inline" style={{ fontSize: 13.5 }}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-muted-2" />
              </button>
              {menuOpen ? (
                <div className="position-absolute end-0 mt-2 card p-1" style={{ width: 230, zIndex: 70 }} role="menu">
                  <div className="px-3 py-2 border-bottom">
                    <div className="fw-bold text-main" style={{ fontSize: 13.5 }}>{user.name}</div>
                    <div className="text-muted-2 text-xs">{user.email}</div>
                  </div>
                  <Link to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2" role="menuitem">
                    <LayoutDashboard size={15} /> {user.role === 'ADMIN' ? 'Admin dashboard' : 'My dashboard'}
                  </Link>
                  <Link to="/user/settings" className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2" role="menuitem">
                    <UserIcon size={15} /> Settings
                  </Link>
                  <button type="button" className="dropdown-item rounded-3 d-flex align-items-center gap-2 py-2 text-danger" role="menuitem" onClick={() => logout()}>
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="d-none d-sm-flex align-items-center gap-2">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/login')}>Log in</button>
              <button type="button" className="btn btn-primary btn-sm px-3" onClick={() => navigate('/register')}>Sign up</button>
            </div>
          )}
          <button type="button" className="btn btn-ghost d-lg-none p-2" aria-label="Toggle menu" style={{ width: 40, height: 40 }} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="d-lg-none card rounded-0 border-0 border-top" style={{ position: 'absolute', insetInline: 0, background: 'var(--card)' }}>
          <nav className="p-2 d-flex flex-column" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <button key={item.label} type="button" className="btn btn-ghost text-start justify-content-between" onClick={() => (item.section ? goSection(item.section) : navigate('/'))}>
                {item.label}
              </button>
            ))}
            <hr className="divider mx-3" />
            {user ? (
              <>
                <Link to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} className="btn btn-ghost text-start">Dashboard</Link>
                <Link to="/user/settings" className="btn btn-ghost text-start">Settings</Link>
                <button type="button" className="btn btn-ghost text-start text-danger" onClick={() => logout()}>Log out</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-ghost text-start" onClick={() => navigate('/login')}>Log in</button>
                <button type="button" className="btn btn-primary text-start" onClick={() => navigate('/register')}>Sign up</button>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
