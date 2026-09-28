import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { ButtonSpinner } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
import api, { errorMessage } from '../../services/api';
export default function ResetPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const token = (location.state && location.state.token) || '';
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  if (user) return <Navigate to="/user/dashboard" replace />;
  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('This reset link is incomplete. Please start again from Forgot Password.');
      navigate('/forgot-password', { replace: true });
      return;
    }
    const next = {};
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      next.password = '8+ characters with upper & lower case, a number and a symbol.';
    }
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const res = await api.post('/auth/reset-password', { token, password: form.password, confirmPassword: form.confirmPassword });
      toast.success(res.data.message || 'Password updated.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Password reset failed.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell visual="reset">
      <h1 className="page-title mb-1">Create a new password</h1>
      <p className="page-subtitle mb-4">Your code was verified. Choose a strong new password for your account.</p>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="rp-password">New password</label>
          <div className="input-group">
            <span className="input-group-text"><Lock size={16} /></span>
            <input id="rp-password" type={showPw ? 'text' : 'password'} className={`form-control ${errors.password ? 'is-invalid' : ''}`} placeholder="New password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
            <button type="button" className="btn btn-ghost" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password ? <div className="invalid-feedback">{errors.password}</div> : null}
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="rp-confirm">Confirm new password</label>
          <input id="rp-confirm" type={showPw ? 'text' : 'password'} className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Repeat new password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
          {errors.confirmPassword ? <div className="invalid-feedback">{errors.confirmPassword}</div> : null}
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={busy}>
          {busy ? <ButtonSpinner /> : null}Update password
        </button>
      </form>
      <p className="text-center text-muted-2 mt-4 mb-0" style={{ fontSize: 13.5 }}>
        <Link to="/login" className="fw-bold">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
