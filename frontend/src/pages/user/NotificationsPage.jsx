import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, AlertTriangle, Bell, BellRing, CheckCheck, FileSearch, ShieldAlert } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import { SkeletonRows } from '../../components/ui/Loaders';
import { classNames, timeAgo } from '../../utils/credibility';
import NotificationEnable from '../../components/ui/NotificationEnable';
import { useAuth } from '../../context/AuthContext';
const TYPE_META = {
  analysis: { chip: 'chip-green', icon: Activity },
  report: { chip: 'chip-teal', icon: Bell },
  security: { chip: 'chip-red', icon: ShieldAlert },
  flagged: { chip: 'chip-orange', icon: AlertTriangle },
  user: { chip: 'chip-blue', icon: BellRing },
  alert: { chip: 'chip-amber', icon: AlertTriangle },
  system: { chip: 'chip-gray', icon: Bell }
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
      const res = await api.get(`/user/notifications?page=${page}&limit=${perPage}`);
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
      await api.put(`/user/notifications/${id}/read`);
      setItems((list) => list.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
      refreshProfile();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the notification.'));
    }
  };
  const markAll = async () => {
    try {
      await api.put('/user/notifications/read-all');
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
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'You are all caught up'} · analysis, report and security updates</p>
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
            title="No notifications yet"
            text="When analyses complete, reports are saved or security events occur, you will see them here — live, thanks to real-time updates."
          />
        ) : (
          <div className="d-flex flex-column">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              const MetaIcon = meta.icon;
              const body = (
                <div className="d-flex align-items-center gap-3 py-3 px-4" style={{ borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(99,102,241,.05)' }}>
                  <span className={classNames('chip', meta.chip, 'text-xs flex-shrink-0 d-inline-grid')} style={{ minWidth: 34, placeItems: 'center' }}>
                    <MetaIcon size={13} />
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-bold text-main text-truncate" style={{ fontSize: 14 }}>{n.title}</div>
                    <p className="text-muted-2 mb-0" style={{ fontSize: 13, lineHeight: 1.5 }}>{n.message}</p>
                  </div>
                  <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0" style={{ minWidth: 72 }}>
                    {!n.read ? <span className="badge rounded-pill text-white" style={{ background: 'var(--primary)', fontSize: 10 }}>new</span> : null}
                    <span className="text-muted-2 text-xs">{timeAgo(n.createdAt)}</span>
                    {n.link ? <Link to={n.link} onClick={() => !n.read && markRead(n._id)} className="btn btn-ghost btn-sm px-2 py-0" style={{ fontSize: 12 }}>Open</Link> : null}
                  </div>
                </div>
              );
              return (
                <div
                  key={n._id}
                  role="button"
                  tabIndex={0}
                  className="text-start w-100 cursor-pointer"
                  onClick={() => !n.read && markRead(n._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !n.read) markRead(n._id); }}
                >
                  {body}
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
