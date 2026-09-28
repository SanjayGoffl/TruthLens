import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Camera, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import AuthShell from '../../components/auth/AuthShell';
import { ButtonSpinner } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
import api, { errorMessage } from '../../services/api';
import { readFileAsDataUrl, resizeImageDataUrl } from '../../utils/credibility';
export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false });
  const [photo, setPhoto] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile picture must be under 2 MB.');
      return;
    }
    const raw = await readFileAsDataUrl(file);
    const resized = await resizeImageDataUrl(raw, 256);
    setPhoto(resized);
  };
  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      next.password = '8+ characters with upper & lower case, a number and a symbol.';
    }
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    if (!form.acceptTerms) next.acceptTerms = 'Accept the Terms & Conditions to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        profileImage: photo,
        acceptTerms: Boolean(form.acceptTerms)
      });
      toast.success(res.data.message || 'Account created.');
      navigate(`/login${location.search}`, { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell visual="register" wide>
      <h1 className="page-title mb-1">Create your account</h1>
      <p className="page-subtitle mb-4">Start verifying the news you read, in minutes.</p>
      <form onSubmit={submit} noValidate>
        <div className="d-flex align-items-center gap-3 mb-3">
          <button type="button" className="btn btn-ghost p-0 border-0 position-relative" aria-label="Upload profile picture" onClick={() => fileRef.current && fileRef.current.click()}>
            {photo ? (
              <img src={photo} alt="Profile preview" className="avatar avatar-lg" />
            ) : (
              <span className="avatar avatar-lg" style={{ fontSize: 30 }}><UserIcon size={34} /></span>
            )}
            <span className="position-absolute bottom-0 end-0 d-inline-grid place-items-center rounded-circle text-white" style={{ width: 26, height: 26, background: 'var(--primary)' }}>
              <Camera size={13} />
            </span>
          </button>
          <div>
            <div className="fw-semibold text-main">Profile picture</div>
            <div className="text-muted-2 text-small">Optional · JPEG, PNG or WebP under 2 MB</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={pickPhoto} aria-label="Choose profile picture file" />
        </div>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <input id="reg-name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="Aarav Sharma" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name ? <div className="invalid-feedback">{errors.name}</div> : null}
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <div className="input-group">
              <span className="input-group-text"><Mail size={16} /></span>
              <input id="reg-email" type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            {errors.email ? <div className="invalid-feedback">{errors.email}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-group">
              <span className="input-group-text"><Lock size={16} /></span>
              <input id="reg-password" type={showPw ? 'text' : 'password'} className={`form-control ${errors.password ? 'is-invalid' : ''}`} placeholder="Create a strong password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
              <button type="button" className="btn btn-ghost" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? <div className="invalid-feedback">{errors.password}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="reg-confirm">Confirm password</label>
            <input id="reg-confirm" type={showPw ? 'text' : 'password'} className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Repeat your password" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
            {errors.confirmPassword ? <div className="invalid-feedback">{errors.confirmPassword}</div> : null}
          </div>
          <div className="col-12">
            <div className="form-text d-flex gap-1 flex-wrap" style={{ color: 'var(--muted)' }}>
              <ShieldCheck size={13} className="flex-shrink-0 mt-1" /> Passwords are hashed with bcrypt — never stored in plain text. Duplicate emails are not allowed.
            </div>
          </div>
          <div className="col-12">
            <div className="form-check">
              <input id="reg-terms" type="checkbox" className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`} checked={form.acceptTerms} onChange={(e) => set('acceptTerms', e.target.checked)} />
              <label className="form-check-label text-secondary-2" htmlFor="reg-terms" style={{ fontSize: 13 }}>
                I have read and accept the <Link to="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link> and <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>.
              </label>
              {errors.acceptTerms ? <div className="invalid-feedback">{errors.acceptTerms}</div> : null}
            </div>
          </div>
          <div className="col-12 mt-4">
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? <ButtonSpinner /> : null}Create account
            </button>
          </div>
        </div>
      </form>
      <p className="text-center text-muted-2 mt-4 mb-0" style={{ fontSize: 13.5 }}>
        Already have an account? <Link to={`/login${location.search}`} className="fw-bold">Sign in</Link>
      </p>
    </AuthShell>
  );
}
