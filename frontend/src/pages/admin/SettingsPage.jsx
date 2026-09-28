import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Bell, Flag, Laptop, LockKeyhole, Moon, ShieldCheck, Sun } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import PersonalDetailsCard from '../../components/ui/PersonalDetailsCard';
import NotifSwitchRow from '../../components/ui/NotifSwitchRow';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ButtonSpinner } from '../../components/ui/Loaders';
const DEFAULT_NOTIF = { analysis: true, results: true, verification: true, security: true, moderation: true, system: true };
export default function SettingsPage() {
  const { user, updateLocalUser, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notif, setNotif] = useState(user && user.notificationPreferences ? { ...DEFAULT_NOTIF, ...user.notificationPreferences } : { ...DEFAULT_NOTIF });
  const [busyPrefs, setBusyPrefs] = useState(false);
  useEffect(() => {
    if (user) setNotif(user.notificationPreferences ? { ...DEFAULT_NOTIF, ...user.notificationPreferences } : { ...DEFAULT_NOTIF });
  }, [user]);
  const savePrefs = async () => {
    setBusyPrefs(true);
    try {
      const res = await api.put('/user/preferences', { notificationPreferences: notif });
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
      <h1 className="page-title mb-4">Admin settings</h1>
      <div className="row g-4">
        <div className="col-lg-7 d-flex flex-column">
          <PersonalDetailsCard showAuthMethod={false} />
        </div>
        <div className="col-lg-5 d-flex flex-column">
          <div className="card p-4 flex-grow-1">
            <h2 className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 15.5 }}><Bell size={17} className="text-success" />Notification management</h2>
            <p className="text-muted-2 text-small mb-2">Real-time updates delivered to this admin account: {user ? user.email : '—'}</p>
            <NotifSwitchRow id="adm-notif-moderation" icon={Flag} title="Moderation &amp; platform events" desc="New registrations, new analyses, flagged content, high-risk sources, status changes." checked disabled locked />
            <NotifSwitchRow id="adm-notif-system" icon={AlertTriangle} title="System &amp; service alerts" desc="AI/analysis errors and maintenance notices." checked={notif.system} onChange={(v) => setNotif({ ...notif, system: v })} />
            <NotifSwitchRow id="adm-notif-security" icon={ShieldCheck} title="Account security" desc="Sign-ins, password, 2FA and profile changes on this account. Always delivered." checked disabled locked />
            <div className="d-flex align-items-center gap-2 mt-2">
              <button type="button" className="btn btn-ghost btn-sm" onClick={savePrefs} disabled={busyPrefs}>
                {busyPrefs ? <ButtonSpinner /> : null}Save preferences
              </button>
              <span className="text-muted-2 text-xs"><LockKeyhole size={11} /> Locked rows are mandatory for admins.</span>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4 mt-1">
        <div className="col-12 d-flex flex-column">
          <div className="card p-4 flex-grow-1">
            <h2 className="d-flex align-items-center gap-2 mb-3" style={{ fontSize: 15.5 }}><Laptop size={17} className="text-success" />Theme</h2>
            <div className="d-flex gap-2">
              <button type="button" className={`btn flex-grow-1 ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTheme('light')}>
                <Sun size={16} className="me-2" />Light
              </button>
              <button type="button" className={`btn flex-grow-1 ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTheme('dark')}>
                <Moon size={16} className="me-2" />Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
