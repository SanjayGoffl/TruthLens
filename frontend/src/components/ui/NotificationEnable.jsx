import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing } from 'lucide-react';
import { enableBrowserNotifications, notificationsSupported, permissionState } from '../../utils/browserNotify';
export default function NotificationEnable() {
  const [state, setState] = useState('unknown');
  useEffect(() => {
    setState(permissionState());
  }, []);
  const enable = async () => {
    const next = await enableBrowserNotifications();
    setState(next);
    if (next === 'granted') {
      toast.success('Browser notifications enabled — live alerts will now appear even when this tab is in the background.');
    } else if (next === 'denied') {
      toast.error('Notifications are blocked. Allow them in your browser site settings, then reload this page.');
    }
  };
  return (
    <div className="card p-3 mb-4" style={{ background: 'linear-gradient(120deg, rgba(99,102,241,.08), transparent 70%)' }}>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0 text-white" style={{ width: 42, height: 42, background: 'var(--primary)' }}>
          <BellRing size={19} />
        </span>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold text-main" style={{ fontSize: 14.5 }}>Real-time browser notifications</div>
          <div className="text-muted-2" style={{ fontSize: 12.8 }}>
            Live alerts appear instantly while this tab is open — analysis progress, credibility results, security events, and admin platform events.
          </div>
        </div>
        {!notificationsSupported() ? (
          <span className="chip chip-gray pill text-xs">Not supported by this browser</span>
        ) : state === 'granted' ? (
          <span className="chip chip-green pill d-inline-flex" style={{ gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />Enabled</span>
        ) : state === 'denied' ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => toast('Allow notifications in your browser site settings, then reload.', { icon: <BellRing size={15} /> })}>Blocked — how to allow</button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={enable}>Enable notifications</button>
        )}
      </div>
    </div>
  );
}
