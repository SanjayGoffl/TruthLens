import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark, Camera, Calendar, FileSearch, Gauge, Mail, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import VerdictBadge from '../../components/ui/VerdictBadge';
import EmptyState from '../../components/ui/EmptyState';
import { ButtonSpinner, SkeletonRows } from '../../components/ui/Loaders';
import { colorForVerdict, fmtDate, initials, readFileAsDataUrl, resizeImageDataUrl } from '../../utils/credibility';
import { useAuth } from '../../context/AuthContext';
export default function ProfilePage({ embedded = false }) {
  const { user, stats, updateLocalUser, refreshProfile } = useAuth();
  const fileRef = useRef(null);
  const [name, setName] = useState(user ? user.name : '');
  const [photo, setPhoto] = useState(user && user.profileImage ? user.profileImage : null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [recent, setRecent] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/analysis/history?page=1&limit=5&sort=newest')
      .then((res) => setRecent(res.data.items))
      .catch(() => setRecent([]));
    if (!stats) refreshProfile();
  }, [stats, refreshProfile]);
  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      toast.error('Name must be between 2 and 80 characters.');
      return;
    }
    setSavingName(true);
    try {
      const res = await api.put('/user/profile', { name: trimmed });
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Name updated.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update your name.'));
    } finally {
      setSavingName(false);
    }
  };
  const pickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile picture must be under 2 MB.');
      return;
    }
    setPhotoBusy(true);
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
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const removePhoto = async () => {
    try {
      const res = await api.put('/user/profile', { profileImage: null });
      setPhoto(null);
      updateLocalUser(res.data.user);
      toast.success('Profile picture removed.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove the picture.'));
    }
  };
  if (!user) return null;
  const s = stats || { totalAnalyses: 0, averageScore: 0, savedReports: 0, unreadNotifications: 0 };
  return (
    <div>
      {!embedded ? <h1 className="page-title mb-4">Profile</h1> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <div className="row g-4 align-items-start">
        <div className="col-lg-4">
          <div className="card p-4 text-center">
            <div className="position-relative d-inline-block mx-auto mb-3">
              {photo ? (
                <img src={photo} alt={`${user.name}'s profile`} className="avatar avatar-lg" style={{ width: 110, height: 110, fontSize: 36 }} />
              ) : (
                <span className="avatar avatar-lg" style={{ width: 110, height: 110, fontSize: 36 }}>{initials(user.name)}</span>
              )}
              <button type="button" className="btn btn-primary btn-sm position-absolute rounded-circle p-2 d-inline-grid place-items-center" style={{ width: 34, height: 34, right: -6, bottom: 2 }} aria-label="Change profile picture" onClick={() => fileRef.current && fileRef.current.click()} disabled={photoBusy}>
                {photoBusy ? <span className="spinner-border spinner-border-sm" role="status" /> : <Camera size={15} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={pickPhoto} aria-label="Choose profile picture" />
            </div>
            <h2 style={{ fontSize: 19 }}>{user.name}</h2>
            <div className="text-muted-2 d-inline-flex align-items-center gap-1 justify-content-center" style={{ fontSize: 13.5 }}>
              <Mail size={13} /> {user.email}
            </div>
            <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
              <span className="chip chip-green pill">{user.role}</span>
              {user.isEmailVerified ? <span className="chip chip-teal pill"><ShieldCheck size={12} /> Email verified</span> : <span className="chip chip-amber pill">Email unverified</span>}
            </div>
            <div className="text-muted-2 mt-3 d-flex align-items-center justify-content-center gap-1" style={{ fontSize: 12.5 }}>
              <Calendar size={13} /> Member since {fmtDate(user.createdAt)}
            </div>
            {photo && !photo.startsWith('data:image') ? null : (
              <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={removePhoto} disabled={!photo}>Remove photo</button>
            )}
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card p-4 mb-4">
            <h3 style={{ fontSize: 15 }} className="mb-3">Account details</h3>
            <div className="mb-3">
              <label className="form-label" htmlFor="profile-name">Full name</label>
              <div className="d-flex gap-2">
                <input id="profile-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                <button type="button" className="btn btn-primary" onClick={saveName} disabled={savingName || name.trim() === user.name}>
                  {savingName ? <ButtonSpinner /> : null}Save
                </button>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-6 col-md-4"><StatCard icon={FileSearch} value={s.totalAnalyses} label="Analyses" iconBg="#6366F1" /></div>
            <div className="col-6 col-md-4"><StatCard icon={Gauge} value={s.totalAnalyses ? s.averageScore : '—'} label="Avg. score" iconBg="#0EA5E9" /></div>
            <div className="col-6 col-md-4"><StatCard icon={Bookmark} value={s.savedReports} label="Saved" iconBg="#8B5CF6" /></div>
          </div>
          <div className="card mt-4 overflow-hidden">
            <div className="px-4 py-3 border-bottom fw-bold" style={{ borderColor: 'var(--border)', fontSize: 14.5 }}>Recent activity</div>
            {recent === null ? (
              <div className="p-4"><SkeletonRows rows={3} cols={4} /></div>
            ) : recent.length === 0 ? (
              <EmptyState icon={FileSearch} title="No analyses yet" text="Your recent activity will appear here after your first analysis." />
            ) : (
              <div className="table-wrap">
                <table className="table align-middle">
                  <thead><tr><th>Article</th><th>Score</th><th>Verdict</th><th>Date</th><th></th></tr></thead>
                  <tbody>
                    {recent.map((a) => (
                      <tr key={a._id}>
                        <td className="fw-semibold text-main text-truncate" style={{ maxWidth: 280, fontSize: 13.5 }}>{a.article && a.article.title || 'Untitled'}</td>
                        <td><span className="font-mono fw-bold" style={{ color: colorForVerdict(a.verdict) }}>{a.overallScore}</span></td>
                        <td><VerdictBadge verdict={a.verdict} size="sm" /></td>
                        <td className="text-muted-2" style={{ fontSize: 12.5 }}>{fmtDate(a.createdAt)}</td>
                        <td><Link to={`/user/result/${a._id}`} className="btn btn-ghost btn-sm">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
