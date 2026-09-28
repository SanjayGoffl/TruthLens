import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/auth/AuthShell';
import { ButtonSpinner } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
import api, { errorMessage } from '../../services/api';
export default function OtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, verifyOtp } = useAuth();
  const email = (location.state && location.state.email) || new URLSearchParams(location.search).get('email') || '';
  const purpose = (location.state && location.state.purpose) || 'login';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
    if (user && purpose === 'login') navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
  }, [email, user, purpose, navigate]);
  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    refs[0].current && refs[0].current.focus();
    setError('');
  }, []);
  const code = digits.join('');
  const setDigit = (i, value) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    setError('');
    if (clean && i < 5) refs[i + 1].current.focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current.focus();
  };
  const submit = async (e) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await verifyOtp(email, code, purpose);
      toast.success('Verified.');
      if (purpose === 'reset') {
        navigate('/reset-password', { state: { token: data.resetToken, email } });
      } else {
        const from = location.state && location.state.from;
        const isAdmin = data.user && data.user.role === 'ADMIN';
        const prefix = isAdmin ? '/admin' : '/user';
        const home = isAdmin ? '/admin/dashboard' : '/user/dashboard';
        navigate(from && from.indexOf(prefix) === 0 ? from : home, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err, 'Verification failed.'));
      setDigits(['', '', '', '', '', '']);
      refs[0].current.focus();
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose });
      toast.success('A new code was sent to your email.');
      setCooldown(45);
      setDigits(['', '', '', '', '', '']);
      refs[0].current.focus();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not resend the code.'));
    } finally {
      setResendBusy(false);
    }
  };
  return (
    <AuthShell visual="otp">
      <h1 className="page-title mb-1">Check your email</h1>
      <p className="page-subtitle mb-4">
        We sent a 6-digit code to <strong className="text-main">{email || 'your email'}</strong>. It expires in 10 minutes and can be used once.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="d-flex justify-content-between mb-3" role="group" aria-label="One-time code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              className="otp-input form-control"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              maxLength={2}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              disabled={busy}
            />
          ))}
        </div>
        {error ? <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{error}</div> : null}
        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={busy || code.length < 6}>
          {busy ? <ButtonSpinner /> : null}Verify code
        </button>
      </form>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <button type="button" className="btn btn-ghost btn-sm" onClick={resend} disabled={cooldown > 0 || resendBusy}>
          {resendBusy ? <ButtonSpinner /> : null}
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>
        <Link to={purpose === 'reset' ? '/forgot-password' : '/login'} className="text-small fw-semibold">Use a different email</Link>
      </div>
    </AuthShell>
  );
}
