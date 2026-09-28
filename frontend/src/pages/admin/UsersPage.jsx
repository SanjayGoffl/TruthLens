import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, Eye, FileSearch, Search, Trash2, UserCheck, UserX, Users as UsersIcon, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import VerdictBadge from '../../components/ui/VerdictBadge';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SkeletonRows } from '../../components/ui/Loaders';
import { classNames, colorForVerdict, fmtDate, initials } from '../../utils/credibility';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
export default function UsersPage() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [actionTarget, setActionTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const debounced = useDebounce(search);
  const perPage = 10;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debounced.trim()) params.set('search', debounced.trim());
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      const res = await api.get(`/admin/users?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Users could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, role, status]);
  useEffect(() => {
    load();
  }, [load]);
  const toggleStatus = async () => {
    setActionBusy(true);
    try {
      const res = await api.put(`/admin/users/${actionTarget._id}/status`, { isActive: !actionTarget.isActive });
      toast.success(res.data.message);
      setActionTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Status change failed.'));
    } finally {
      setActionBusy(false);
    }
  };
  const removeUser = async () => {
    setActionBusy(true);
    try {
      const res = await api.delete(`/admin/users/${actionTarget._id}`);
      toast.success(res.data.message);
      setActionTarget(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the user.'));
    } finally {
      setActionBusy(false);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">User management</h1>
          <p className="page-subtitle">Manage accounts, roles and access status</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-3 d-flex flex-wrap gap-2 align-items-center border-bottom" style={{ borderColor: 'var(--border)' }}>
          <div className="input-group" style={{ maxWidth: 300 }}>
            <span className="input-group-text"><Search size={15} /></span>
            <input className="form-control" placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search users" />
          </div>
          <select className="form-select" style={{ maxWidth: 150 }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter role">
            <option value="">All roles</option><option value="USER">USER</option><option value="ADMIN">ADMIN</option>
          </select>
          <select className="form-select" style={{ maxWidth: 170 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter status">
            <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Deactivated</option>
          </select>
          <span className="chip chip-gray ms-auto">{total} user{total === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <div className="p-4"><SkeletonRows rows={6} cols={6} /></div>
        ) : error ? (
          <div className="p-5 text-center">
            <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
            <h5>Could not load users</h5>
            <p className="text-muted-2">{error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={UsersIcon} title={search || role || status ? 'No matching users' : 'No users registered'} text={search || role || status ? 'Adjust the search or filters.' : 'Users appear here after registration.'} />
        ) : (
          <div className="table-wrap">
            <table className="table align-middle">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Analyses</th><th>Avg score</th><th>2FA</th><th>Joined</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((u) => {
                  const isMe = me && String(me.id) === String(u._id);
                                    return (
                    <tr key={u._id} className={!u.isActive ? 'opacity-75' : ''}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {u.profileImage ? <img src={u.profileImage} alt="" className="avatar avatar-sm" /> : <span className="avatar avatar-sm">{initials(u.name)}</span>}
                          <div>
                            <div className="fw-semibold text-main" style={{ fontSize: 13.5 }}>{u.name} {isMe ? <span className="chip chip-green text-xs ms-1">you</span> : null}</div>
                            <div className="text-muted-2 text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={classNames('chip text-xs', u.role === 'ADMIN' ? 'chip-blue' : 'chip-gray')}>{u.role}</span></td>
                      <td>{u.isActive ? <span className="chip chip-green text-xs"><UserCheck size={12} /> Active</span> : <span className="chip chip-red text-xs"><UserX size={12} /> Deactivated</span>}</td>
                      <td>{u.analysisCount}</td>
                      <td className="font-mono text-small">{u.averageScore ? `${u.averageScore}/100` : '—'}</td>
                      <td>{u.twoFactorEnabled ? <span className="chip chip-teal text-xs">Enabled</span> : <span className="text-muted-2 text-xs">Off</span>}</td>
                      <td className="text-muted-2" style={{ fontSize: 12.5 }}>{fmtDate(u.createdAt)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end flex-wrap">
                          <button type="button" className="btn btn-ghost btn-sm" title="View details" aria-label="View user details" onClick={() => setDetailId(u._id)}><Eye size={15} /></button>
                          {!isMe ? (
                            <button type="button" className="btn btn-ghost btn-sm" title={u.isActive ? 'Deactivate user' : 'Activate user'} aria-label={u.isActive ? 'Deactivate user' : 'Activate user'} onClick={() => setActionTarget({ _id: u._id, name: u.name, kind: 'status' })}>
                              {u.isActive ? <Ban size={15} className="text-warning" /> : <CheckCircle2 size={15} className="text-success" />}
                            </button>
                          ) : null}
                          {!isMe ? (
                            <button type="button" className="btn btn-ghost btn-sm text-danger" title="Delete user" aria-label="Delete user" onClick={() => setActionTarget({ _id: u._id, name: u.name, kind: 'delete' })}>
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length ? <div className="px-3 pb-3"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div> : null}
      </div>
      <ConfirmDialog
        open={actionTarget && actionTarget.kind === 'status'}
        title={actionTarget && actionTarget.isActive ? 'Deactivate user?' : 'Activate user?'}
        text={actionTarget ? `${actionTarget.name} will ${actionTarget.isActive ? 'lose access immediately and be signed out on next request' : 'regain access to their account'}.` : ''}
        confirmLabel={actionTarget && actionTarget.isActive ? 'Deactivate' : 'Activate'}
        danger={Boolean(actionTarget && actionTarget.isActive)}
        busy={actionBusy}
        onConfirm={toggleStatus}
        onClose={() => setActionTarget(null)}
      />
      <ConfirmDialog
        open={actionTarget && actionTarget.kind === 'delete'}
        title="Delete user permanently?"
        text={actionTarget ? `All data belonging to ${actionTarget.name} (analyses, claims, reports, notifications) will be permanently deleted. This cannot be undone.` : ''}
        confirmLabel="Delete user"
        busy={actionBusy}
        onConfirm={removeUser}
        onClose={() => setActionTarget(null)}
      />
      <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} onChanged={load} />
    </div>
  );
}
function UserDetailModal({ userId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [busyStatus, setBusyStatus] = useState(false);
  useEffect(() => {
    if (!userId) return undefined;
    setData(null);
    api
      .get(`/admin/users/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errorMessage(err, 'User details could not be loaded.')));
    return undefined;
  }, [userId]);
  if (!userId) return null;
  const doToggle = async (target) => {
    setBusyStatus(true);
    try {
      const res = await api.put(`/admin/users/${target._id}/status`, { isActive: !target.isActive });
      toast.success(res.data.message);
      const refreshed = await api.get(`/admin/users/${userId}`);
      setData(refreshed.data);
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Status change failed.'));
    } finally {
      setBusyStatus(false);
    }
  };
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(2,6,23,.6)', zIndex: 1000 }} role="dialog" aria-modal="true" aria-label="User details">
      <div className="card w-100" style={{ maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom position-sticky top-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="mb-0" style={{ fontSize: 16 }}>User details</h2>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="p-4">
          {!data ? (
            <div className="d-flex justify-content-center py-5"><div className="spinner-border text-success" role="status" /></div>
          ) : (
            <>
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                {data.user.profileImage ? <img src={data.user.profileImage} alt="" className="avatar avatar-md" /> : <span className="avatar avatar-md">{initials(data.user.name)}</span>}
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-bold" style={{ fontSize: 17 }}>{data.user.name}</div>
                  <div className="text-muted-2 text-small">{data.user.email} · joined {fmtDate(data.user.createdAt)}</div>
                </div>
                <span className={classNames('chip', data.user.role === 'ADMIN' ? 'chip-blue' : 'chip-gray')}>{data.user.role}</span>
                {data.user.isActive ? <span className="chip chip-green">Active</span> : <span className="chip chip-red">Deactivated</span>}
              </div>
              <div className="row g-3 mb-4">
                {[
                  { label: 'Total analyses', value: data.stats.total || 0 },
                  { label: 'Average score', value: data.stats.avg ? `${Math.round(data.stats.avg)}/100` : '—' },
                  { label: 'Email verified', value: data.user.isEmailVerified ? 'Yes' : 'No' },
                  { label: 'Security code', value: data.user.twoFactorEnabled ? 'On' : 'Off' }
                ].map((s) => (
                  <div className="col-6 col-md-3" key={s.label}>
                    <div className="p-3 rounded-3 h-100" style={{ background: 'var(--bg-2)' }}>
                      <div className="fw-bold">{s.value}</div>
                      <div className="text-muted-2 text-xs">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-end gap-2 mb-3">
                <button type="button" className="btn btn-ghost btn-sm" disabled={busyStatus} onClick={() => doToggle(data.user)}>
                  {data.user.isActive ? <><Ban size={14} className="me-1 text-warning" />Deactivate</> : <><UserCheck size={14} className="me-1" />Activate</>}
                </button>
              </div>
              <h3 className="mb-2" style={{ fontSize: 14.5 }}>Analysis activity ({data.analyses.length > 0 ? `${data.analyses.length} recent` : '0'})</h3>
              {data.analyses.length ? (
                <div className="d-grid gap-2">
                  {data.analyses.map((a) => (
                    <div key={a._id} className="d-flex align-items-center gap-2 p-2 rounded-3 flex-wrap" style={{ background: 'var(--bg-2)' }}>
                      <span className="font-mono fw-bold" style={{ color: colorForVerdict(a.verdict), minWidth: 36 }}>{a.overallScore}</span>
                      <VerdictBadge verdict={a.verdict} size="sm" />
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-main text-truncate" style={{ fontSize: 13 }}>{a.article && a.article.title || 'Untitled'}</div>
                        <div className="text-muted-2 text-xs">{a.article && (a.article.domain || a.article.publisher) || 'Pasted content'} · {fmtDate(a.createdAt)}</div>
                      </div>
                      {a.isSaved ? <span className="chip chip-teal text-xs">saved</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-2 text-small mb-0">This user has not analyzed any articles yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
