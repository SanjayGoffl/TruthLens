import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import AuthVisual from './AuthVisual';
export default function AuthShell({ children, visual = 'login', wide }) {
  return (
    <div className="auth-bg">
      <div className="auth-topbar">
        <Logo />
        <ThemeToggle />
      </div>
      <div className="auth-shell" style={wide ? { gridTemplateColumns: '1fr 1.15fr' } : undefined}>
        <div className="auth-visual d-none d-lg-flex">
          <AuthVisual variant={visual} />
        </div>
        <div className="auth-form-side">
          <div className="auth-card">{children}</div>
        </div>
      </div>
    </div>
  );
}
