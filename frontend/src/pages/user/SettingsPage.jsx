import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, Bell, FileText, Globe, KeyRound, Laptop, Lock, LockKeyhole, LogOut, Mail, Moon, ShieldCheck, Sun, UserCog } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import { ButtonSpinner } from '../../components/ui/Loaders';
import ProfilePage from './ProfilePage';
import NotifSwitchRow from '../../components/ui/NotifSwitchRow';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
const DEFAULT_NOTIF = { analysis: true, results: true, verification: true, security: true, moderation: true, system: true };
const DEFAULT_EMAIL = { productUpdates: true, securityAlerts: true };
export default function SettingsPage() {
  const { user, updateLocalUser, refreshProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [twoFa, setTwoFa] = useState(user ? user.twoFactorEnabled : true);
  const [twoFaPassword, setTwoFaPassword] = useState('');
  const [busyTwoFa, setBusyTwoFa] = useState(false);
  const [notif, setNotif] = useState(user && user.notificationPreferences ? { ...DEFAULT_NOTIF, ...user.notificationPreferences } : { ...DEFAULT_NOTIF });
  const [emailPrefs, setEmailPrefs] = useState(user && user.emailPreferences ? { ...DEFAULT_EMAIL, ...user.emailPreferences } : { ...DEFAULT_EMAIL });
  const [busyPrefs, setBusyPrefs] = useState(false);
  useEffect(() => {
    if (user) {
      setTwoFa(user.twoFactorEnabled);
      setNotif(user.notificationPreferences ? { ...DEFAULT_NOTIF, ...user.notificationPreferences } : { ...DEFAULT_NOTIF });
      setEmailPrefs(user.emailPreferences ? { ...DEFAULT_EMAIL, ...user.emailPreferences } : { ...DEFAULT_EMAIL });
    }
  }, [user]);
  if (!user) return null;
  const enableTwoFa = async () => {
    if (!twoFaPassword) {
      toast.error('Enter your current password to enable the email security code.');
      return;
    }
    setBusyTwoFa(true);
    try {
      const res = await api.put('/user/preferences', { twoFactorEnabled: true, currentPassword: twoFaPassword });
      setTwoFa(true);
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Email security code enabled.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not enable the security code.'));
    } finally {
      setBusyTwoFa(false);
    }
  };
  const disableTwoFa = async () => {
    if (!twoFaPassword) {
      toast.error('Enter your current password to turn off the email security code.');
      return;
    }
    setBusyTwoFa(true);
    try {
      const res = await api.put('/user/preferences', { twoFactorEnabled: false, currentPassword: twoFaPassword });
      setTwoFa(false);
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Email security code disabled. Sign-ins will no longer require a code.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not disable the security code.'));
    } finally {
      setBusyTwoFa(false);
    }
  };
  const savePrefs = async () => {
    setBusyPrefs(true);
    try {
      const res = await api.put('/user/preferences', { emailPreferences: emailPrefs, notificationPreferences: notif });
      updateLocalUser(res.data.user);
      refreshProfile();
      toast.success('Notification preferences saved.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save preferences.'));
    } finally {
      setBusyPrefs(false);
    }
  };
  return (
    <div>
      <h1 className="page-title mb-4">Settings</h1>
      <div className="mb-4"><ProfilePage embedded /></div>
      <div className="row g-4 align-items-start">
        <div className="col-lg-6 d-flex flex-column" style={{ gap: 16 }}>
          <div className="card p-4">
            <h2 className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 15.5 }}><ShieldCheck size={17} className="text-success" />Two-factor authentication</h2>
            <p className="text-muted-2 text-small mb-3">
              When enabled, every manual sign-in requires a single-use code emailed to you (valid 10 minutes, max {5} attempts). Google sign-in accounts do not require codes.
            </p>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className={`chip ${twoFa ? 'chip-green' : 'chip-gray'}`}>{twoFa ? 'Email security code: ON' : 'Email security code: OFF'}</span>
              <div className="input-group" style={{ maxWidth: 280 }}>
                <span className="input-group-text"><KeyRound size={14} /></span>
                <input type="password" className="form-control" placeholder="Current password to change" value={twoFaPassword} onChange={(e) => setTwoFaPassword(e.target.value)} aria-label="Current password" />
              </div>
              <button type="button" className="btn btn-ghost" disabled={busyTwoFa} onClick={twoFa ? disableTwoFa : enableTwoFa}>
                {busyTwoFa ? <ButtonSpinner /> : null}{twoFa ? 'Turn off' : 'Turn on'}
              </button>
            </div>
            <p className="text-muted-2 text-xs mt-3 mb-0">
              Forgot your password? Use <em>Forgot password</em> on the sign-in page to reset it — a one-time code is emailed to you.
            </p>
          </div>
          <div className="card p-4">
            <h2 className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 15.5 }}><Laptop size={17} className="text-success" />Theme</h2>
            <p className="text-muted-2 text-small mb-3">Applies across the whole application and persists after refresh.</p>
            <div className="d-flex gap-2">
              <button type="button" className={`btn flex-grow-1 ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTheme('light')}>
                <Sun size={16} className="me-2" />Light
              </button>
              <button type="button" className={`btn flex-grow-1 ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTheme('dark')}>
                <Moon size={16} className="me-2" />Dark
              </button>
            </div>
          </div>
          <div className="card p-4" style={{ borderColor: 'rgba(220,38,38,.3)' }}>
            <h2 className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 15.5 }}><UserCog size={17} className="text-danger" />Account</h2>
            <p className="text-muted-2 text-small mb-3">Sign out of this device. Your session token is cleared and protected pages require sign-in again.</p>
            <button type="button" className="btn btn-danger-soft" onClick={() => logout()}>
              <LogOut size={15} className="me-2" />Log out everywhere
            </button>
          </div>
        </div>
        <div className="col-lg-6 d-flex flex-column" style={{ gap: 16 }}>
          <div className="card p-4">
            <h2 className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 15.5 }}><Bell size={17} className="text-success" />Notifications &amp; alerts</h2>
            <p className="text-muted-2 text-small mb-2">Choose which real-time updates this account receives in the browser — as toasts, native notifications and in the Notification center.</p>
            <div className="text-uppercase text-muted-2 fw-bold text-xs mt-1 mb-1">Real-time browser notifications</div>
            <NotifSwitchRow id="notif-analysis" icon={Activity} title="Analysis progress" desc="Uploads, submissions and analysis start, completion or failure." checked={notif.analysis} onChange={(v) => setNotif({ ...notif, analysis: v })} />
            <NotifSwitchRow id="notif-results" icon={FileText} title="Results &amp; credibility alerts" desc="Scores, generated reports, PDF downloads, saved or deleted analyses, suspicious and misleading findings." checked={notif.results} onChange={(v) => setNotif({ ...notif, results: v })} />
            <NotifSwitchRow id="notif-verification" icon={Globe} title="Claims &amp; source checks" desc="Claim verdicts, unsupported or contradictory claims and source reliability." checked={notif.verification} onChange={(v) => setNotif({ ...notif, verification: v })} />
            <NotifSwitchRow id="notif-security" icon={ShieldCheck} title="Account security" desc="Sign-ins, password, 2FA and profile changes. Always on." checked disabled locked />
            <div className="text-uppercase text-muted-2 fw-bold text-xs mt-3 mb-1">Email preferences</div>
            <div className="form-check form-switch mb-1 py-1">
              <input id="pref-product" className="form-check-input" type="checkbox" checked={emailPrefs.productUpdates} onChange={(e) => setEmailPrefs({ ...emailPrefs, productUpdates: e.target.checked })} />
              <label className="form-check-label text-secondary-2" htmlFor="pref-product" style={{ fontSize: 14 }}>Product updates &amp; tips</label>
            </div>
            <div className="form-check form-switch mb-1 py-1">
              <input id="pref-security" className="form-check-input" type="checkbox" checked={emailPrefs.securityAlerts} onChange={(e) => setEmailPrefs({ ...emailPrefs, securityAlerts: e.target.checked })} />
              <label className="form-check-label text-secondary-2" htmlFor="pref-security" style={{ fontSize: 14 }}>Security alerts (sign-ins, password changes)</label>
            </div>
            <div className="d-flex align-items-center gap-2 mt-2">
              <button type="button" className="btn btn-ghost" onClick={savePrefs} disabled={busyPrefs}>
                {busyPrefs ? <ButtonSpinner /> : null}Save preferences
              </button>
              <span className="text-muted-2 text-xs d-inline-flex align-items-center gap-1"><Lock size={11} /> Security events stay on.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
