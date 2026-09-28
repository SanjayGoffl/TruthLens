import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { ButtonSpinner } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
import api, { errorMessage } from '../../services/api';
export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errors, setErrors] = useState({});
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  const nextPath = new URLSearchParams(location.search).get('next') || (location.state && location.state.from) || '/user/dashboard';
  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const data = await login(email.trim(), password);
      toast.success(data.message || 'Welcome back.');
      if (data.otpRequired) {
        navigate('/verify-otp', { state: { email: email.trim(), purpose: 'login', from: nextPath } });
      } else {
        navigate(nextPath, { replace: true });
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Sign in failed.'));
    } finally {
      setBusy(false);
    }
  };
  const google = async () => {
    setGoogleBusy(true);
    try {
      const res = await api.get('/auth/google');
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(errorMessage(err, 'Google sign-in is unavailable.'));
      setGoogleBusy(false);
    }
  };
  return (
    <AuthShell visual="login">
      <h1 className="page-title mb-1">Welcome back</h1>
      <p className="page-subtitle mb-4">Sign in to analyze news with confidence.</p>
      <button type="button" className="btn w-100 d-flex align-items-center justify-content-center gap-2 mb-3" style={{ border: '1px solid var(--border)', background: 'var(--card)' }} onClick={google} disabled={googleBusy}>
        {googleBusy ? <ButtonSpinner /> : (
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 35.9 44 30.5 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
        )}
        Sign in with Google
      </button>
      <div className="d-flex align-items-center gap-3 mb-3">
        <hr className="divider flex-grow-1" />
        <span className="text-muted-2 text-small">or with email</span>
        <hr className="divider flex-grow-1" />
      </div>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="login-email">Email address</label>
          <div className="input-group">
            <span className="input-group-text"><Mail size={16} /></span>
            <input id="login-email" type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {errors.email ? <div className="invalid-feedback">{errors.email}</div> : null}
        </div>
        <div className="mb-2">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-group">
            <span className="input-group-text"><Lock size={16} /></span>
            <input id="login-password" type={showPw ? 'text' : 'password'} className={`form-control ${errors.password ? 'is-invalid' : ''}`} placeholder="Your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="btn btn-ghost" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password ? <div className="invalid-feedback">{errors.password}</div> : null}
        </div>
        <div className="d-flex justify-content-end mb-3">
          <Link to="/forgot-password" className="text-small fw-semibold">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={busy}>
          {busy ? <ButtonSpinner /> : null}Continue
        </button>
      </form>
      <p className="text-center text-muted-2 mt-4 mb-0" style={{ fontSize: 13.5 }}>
        New to TruthLens AI? <Link to="/register" className="fw-bold">Create an account</Link>
      </p>
      <p className="text-center text-muted-2 mt-2 mb-0" style={{ fontSize: 12 }}>
        After sign-in you will receive a one-time security code by email.
      </p>
    </AuthShell>
  );
}
