import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { ButtonSpinner } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
import api, { errorMessage } from '../../services/api';
export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('If an account exists, a reset code has been sent.');
      navigate('/verify-otp', { state: { email: email.trim(), purpose: 'reset' } });
      return res;
    } catch (err) {
      setError(errorMessage(err, 'Could not send the reset code.'));
    } finally {
      setBusy(false);
    }
    return null;
  };
  return (
    <AuthShell visual="reset">
      <h1 className="page-title mb-1">Forgot your password?</h1>
      <p className="page-subtitle mb-4">
        Enter the email address linked to your account and we will send you a one-time reset code. We never reveal whether an account exists.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label className="form-label" htmlFor="fp-email">Email address</label>
          <div className="input-group">
            <span className="input-group-text"><Mail size={16} /></span>
            <input id="fp-email" type="email" className={`form-control ${error ? 'is-invalid' : ''}`} placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} />
          </div>
          {error ? <div className="invalid-feedback">{error}</div> : null}
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={busy}>
          {busy ? <ButtonSpinner /> : null}Send reset code
        </button>
      </form>
      <p className="text-center text-muted-2 mt-4 mb-0" style={{ fontSize: 13.5 }}>
        Remembered it? <Link to="/login" className="fw-bold">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
