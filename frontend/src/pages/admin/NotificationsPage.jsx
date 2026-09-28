import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, CheckCheck, FileSearch, ShieldAlert, UserPlus, Activity, Info } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import { SkeletonRows } from '../../components/ui/Loaders';
import { classNames, timeAgo } from '../../utils/credibility';
import NotificationEnable from '../../components/ui/NotificationEnable';
import { useAuth } from '../../context/AuthContext';
const TYPE_META = {
  flagged: { chip: 'chip-orange', label: 'Flagged article' },
  user: { chip: 'chip-blue', label: 'New user' },
  security: { chip: 'chip-red', label: 'Security' },
  system: { chip: 'chip-gray', label: 'System' },
  analysis: { chip: 'chip-green', label: 'Analysis' },
  alert: { chip: 'chip-amber', label: 'Alert' },
  report: { chip: 'chip-teal', label: 'Report' }
};
export default function NotificationsPage() {
  const { refreshProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const perPage = 15;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/notifications?page=${page}&limit=${perPage}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setUnread(res.data.unread);
    } catch (err) {
      setError(errorMessage(err, 'Notifications could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);
  const markRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setItems((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
      refreshProfile();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the notification.'));
    }
  };
  const markAll = async () => {
    try {
      await api.put('/admin/notifications/read-all');
      setItems((list) => list.map((n) => ({ ...n, read: true })));
      setUnread(0);
      refreshProfile();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update notifications.'));
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Admin notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up'} · new flagged articles, users, security and system alerts</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={markAll} disabled={!unread}>
          <CheckCheck size={15} className="me-1" />Mark all read
        </button>
      </div>
      <NotificationEnable />
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4"><SkeletonRows rows={6} cols={3} /></div>
        ) : error ? (
          <div className="p-5 text-center">
            <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
            <h5>Could not load notifications</h5>
            <p className="text-muted-2">{error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No notifications"
            text="Moderation, security and system events will be delivered here in real time."
          />
        ) : (
          <div className="d-flex flex-column">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              const Icon = n.type === 'flagged' ? ShieldAlert : n.type === 'user' ? UserPlus : n.type === 'security' ? Info : Activity;
              return (
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  className="d-flex align-items-center gap-3 py-3 px-4 w-100 text-start cursor-pointer"
                  style={{ borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(99,102,241,.05)' }}
                  onClick={() => !n.read && markRead(n._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !n.read) markRead(n._id); }}
                >
                  <span className={classNames('chip text-xs flex-shrink-0', meta.chip)} style={{ minWidth: 36, justifyContent: 'center' }}>
                    <Icon size={13} />
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between gap-2 flex-wrap">
                      <span className="fw-bold text-main" style={{ fontSize: 14 }}>{n.title} <span className="chip chip-gray text-xs ms-1">{meta.label}</span></span>
                      <span className="text-muted-2 text-xs flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-muted-2 mb-0" style={{ fontSize: 13 }}>{n.message}</p>
                  </div>
                  {!n.read ? <span className="badge rounded-pill text-white flex-shrink-0" style={{ background: 'var(--primary)' }}>new</span> : null}
                </div>
              );
            })}
          </div>
        )}
        {!loading && items.length ? <div className="px-4 py-3"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div> : null}
      </div>
    </div>
  );
}
