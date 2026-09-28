import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AtSign, Camera, Calendar, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ButtonSpinner } from './Loaders';
import { fmtDate, initials, readFileAsDataUrl, resizeImageDataUrl } from '../../utils/credibility';
export default function PersonalDetailsCard({ showAuthMethod = true }) {
  const { user, updateLocalUser, refreshProfile } = useAuth();
  const fileRef = useRef(null);
  const [name, setName] = useState(user ? user.name : '');
  const [photo, setPhoto] = useState(user && user.profileImage ? user.profileImage : null);
  const [busy, setBusy] = useState(''); // '' | 'photo' | 'name' | 'remove'
  if (!user) return null;
  const nameDirty = name.trim() !== user.name;
  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      toast.error('Name must be between 2 and 80 characters.');
      return;
    }
    setBusy('name');
    try {
      const res = await api.put('/user/profile', { name: trimmed });
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Name updated.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update your name.'));
    } finally {
      setBusy('');
    }
  };
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile picture must be under 2 MB.');
      return;
    }
    setBusy('photo');
    try {
      const raw = await readFileAsDataUrl(file);
      const resized = await resizeImageDataUrl(raw, 256);
      const res = await api.put('/user/profile', { profileImage: resized });
      setPhoto(res.data.user.profileImage);
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Profile picture updated.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not upload the picture.'));
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const removePhoto = async () => {
    setBusy('remove');
    try {
      const res = await api.put('/user/profile', { profileImage: null });
      setPhoto(null);
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Profile picture removed.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove the picture.'));
    } finally {
      setBusy('');
    }
  };
  return (
    <div className="card p-4 flex-grow-1">
            <h2 className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 15.5 }}><UserRound size={17} className="text-success" />Personal details</h2>
      <p className="text-muted-2 text-small mb-3">The account holder&apos;s profile — shown across the dashboard and in notifications.</p>
      <div className="d-flex gap-3 align-items-center">
        <div className="position-relative flex-shrink-0">
          {photo ? (
            <img src={photo} alt={`${user.name}'s profile`} className="avatar avatar-lg" style={{ width: 96, height: 96, fontSize: 34 }} />
          ) : (
            <span className="avatar avatar-lg" style={{ width: 96, height: 96, fontSize: 34 }}>{initials(user.name)}</span>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm position-absolute rounded-circle p-1 d-inline-grid place-items-center"
            style={{ width: 30, height: 30, right: -4, bottom: -2 }}
            aria-label="Change profile picture"
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={busy === 'photo'}
          >
            {busy === 'photo' ? <span className="spinner-border spinner-border-sm" role="status" /> : <Camera size={14} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={pickPhoto} aria-label="Choose profile picture" />
        </div>
        <div className="d-grid gap-1 min-w-0">
          <div className="fw-bold text-main text-truncate" style={{ fontSize: 15 }}>{user.name}</div>
          <div className="text-muted-2 text-small text-truncate d-inline-flex align-items-center gap-1">
            <AtSign size={12} /> {user.email}
          </div>
          <div className="d-flex flex-wrap gap-1 mt-1">
            <span className={`chip chip-${user.role === 'ADMIN' ? 'amber' : 'green'} pill text-xs`}>{user.role}</span>
            {showAuthMethod && (user.googleId ? <span className="chip chip-blue pill text-xs">Google sign-in</span> : <span className="chip chip-blue pill text-xs">Email + code</span>)}
            <span className="chip chip-gray pill text-xs"><Calendar size={10} /> {fmtDate(user.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="row g-3 mt-3">
        <div className="col-12">
          <label className="form-label" htmlFor="pd-name">Full name</label>
          <input id="pd-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Full name" />
          <div className="form-text">2–80 characters. Used in the dashboard header and activity.</div>
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={saveName} disabled={!nameDirty || busy === 'name'}>
          {busy === 'name' ? <ButtonSpinner /> : null}Save name
        </button>
        {photo ? (
          <button type="button" className="btn btn-ghost btn-sm text-danger d-inline-flex align-items-center gap-1" onClick={removePhoto} disabled={busy === 'remove'}>
            {busy === 'remove' ? <ButtonSpinner /> : <Trash2 size={14} />}Remove photo
          </button>
        ) : (
          <span className="text-muted-2 text-xs d-inline-flex align-items-center gap-1 align-self-center">
            <ShieldCheck size={12} /> Photos are stored privately on your account.
          </span>
        )}
      </div>
      <div className="d-flex justify-content-between flex-wrap gap-2 mt-4 pt-3 border-top text-xs text-muted-2" style={{ borderColor: 'var(--border)' }}>
        <span className="d-inline-flex align-items-center gap-1"><ShieldCheck size={12} /> Picture and name appear in the header and on your profile.</span>
        <span className="d-inline-flex align-items-center gap-1"><AtSign size={12} /> Updated {fmtDate(user.updatedAt)}</span>
      </div>
    </div>
  );
}
