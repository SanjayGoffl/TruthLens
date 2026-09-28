import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, FileSearch, Flag, SearchCheck, ShieldAlert, ShieldCheck, ShieldX, StickyNote, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import VerdictBadge from '../../components/ui/VerdictBadge';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import AdminViewAnalysisModal from '../../components/admin/AdminViewAnalysisModal';
import { ButtonSpinner, SkeletonCards } from '../../components/ui/Loaders';
import { classNames, colorForVerdict, flagStatusMeta, fmtDate, timeAgo } from '../../utils/credibility';
import { useDebounce } from '../../hooks/useDebounce';
const SEVERITY_META = {
  low: { label: 'Low', chip: 'chip-teal' },
  medium: { label: 'Medium', chip: 'chip-amber' },
  high: { label: 'High', chip: 'chip-orange' },
  critical: { label: 'Critical', chip: 'chip-red' }
};
export default function FlaggedPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState(null);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState('');
  const [nextStatus, setNextStatus] = useState(null);
  const debounced = useDebounce(search);
  const perPage = 9;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debounced.trim()) params.set('search', debounced.trim());
      if (status) params.set('status', status);
      const res = await api.get(`/admin/flagged?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Flagged articles could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, status]);
  useEffect(() => {
    load();
  }, [load]);
  const applyStatus = async (flagged, targetStatus) => {
    if (nextStatus && String(nextStatus._id) === String(flagged._id)) return;
    const payload = { status: targetStatus };
    if (notes[flagged._id] && notes[flagged._id].trim()) payload.moderationNotes = notes[flagged._id].trim();
    setBusyId(String(flagged._id));
    setNextStatus({ _id: flagged._id, status: targetStatus });
    try {
      const res = await api.put(`/admin/flagged/${flagged._id}`, payload);
      toast.success(res.data.message);
      setNotes((n) => ({ ...n, [flagged._id]: '' }));
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the flag.'));
    } finally {
      setBusyId('');
      setNextStatus(null);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Flagged articles</h1>
          <p className="page-subtitle">Auto-flagged records — low credibility, unsupported claims, contradictions, suspicious language</p>
        </div>
      </div>
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center" role="group" aria-label="Filter flags by status">
        {['', 'pending', 'reviewed', 'verified', 'suspicious'].map((s) => (
          <button key={s || 'all'} type="button" className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s === '' ? 'All' : flagStatusMeta(s).label}
          </button>
        ))}
        <div className="input-group ms-auto" style={{ maxWidth: 260 }}>
          <input className="form-control" placeholder="Search title or domain…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search flagged articles" />
          {search ? <button type="button" className="btn btn-ghost" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button> : null}
        </div>
      </div>
      {loading ? (
        <SkeletonCards count={3} height={230} />
      ) : error ? (
        <div className="card p-5 text-center">
          <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
          <h5>Could not load flagged articles</h5>
          <p className="text-muted-2">{error}</p>
          <button type="button" className="btn btn-ghost btn-sm mx-auto" onClick={load}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Flag}
            title={search ? 'No flagged articles match your search' : status ? `No ${flagStatusMeta(status).label.toLowerCase()} flags` : 'No flagged articles'}
            text={search ? 'Try a different search term.' : 'Articles are flagged automatically when analyses show low credibility, unsupported claims, contradictions, suspicious language or a suspicious source.'}
          />
        </div>
      ) : (
        <>
          <div className="row g-4">
            {items.map((f) => {
              const meta = flagStatusMeta(f.status);
              const severity = SEVERITY_META[f.severity] || SEVERITY_META.medium;
              const analysis = f.analysis || {};
              const article = analysis.article || {};
              const busy = busyId === String(f._id);
              const pendingNext = nextStatus && String(nextStatus._id) === String(f._id);
              return (
                <div className="col-lg-6 col-xl-4" key={f._id}>
                  <div className="card h-100 d-flex flex-column">
                    <div className="p-3 pb-2 d-flex gap-2 align-items-start">
                      <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: 36, height: 36, background: 'rgba(220,38,38,.1)', color: 'var(--danger)' }}><ShieldAlert size={17} /></span>
                      <div className="min-w-0 flex-grow-1">
                        <div className="fw-bold text-main" style={{ fontSize: 13.5, lineHeight: 1.4 }}>{article.title || 'Untitled article'}</div>
                        <div className="text-muted-2 text-xs mt-1">{article.domain || article.publisher || 'Pasted content'}{f.user ? ` · by ${f.user.name}` : ''}</div>
                      </div>
                    </div>
                    <div className="px-3 pb-2 d-flex flex-wrap gap-1">
                      {(f.reasons || []).map((r) => <span key={r} className="chip chip-amber text-xs">{r}</span>)}
                    </div>
                    <div className="px-3 pb-2 d-flex flex-wrap gap-1 align-items-center">
                      <VerdictBadge verdict={analysis.verdict} size="sm" />
                      <span className="font-mono text-small fw-bold" style={{ color: colorForVerdict(analysis.verdict) }}>{analysis.overallScore}/100</span>
                      <span className={classNames('chip text-xs', severity.chip)}>{severity.label} severity</span>
                      <span className={classNames('chip text-xs ms-auto', meta.chip)}>{meta.label}</span>
                    </div>
                    <div className="px-3 pb-2">
                      <div className="text-muted-2 text-xs">Flagged {timeAgo(f.createdAt)} · {article.author ? `by ${article.author}` : 'no author'}</div>
                      {f.moderationNotes ? <div className="mt-2 text-small text-secondary-2 p-2 rounded-3" style={{ background: 'var(--bg-2)' }}><StickyNote size={12} className="me-1" />{f.moderationNotes}</div> : null}
                    </div>
                    <div className="p-3 pt-2 mt-auto d-flex flex-column gap-2">
                      <div className="input-group">
                        <span className="input-group-text"><StickyNote size={13} /></span>
                        <input
                          className="form-control"
                          placeholder="Moderation note (optional)"
                          value={notes[f._id] || ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [f._id]: e.target.value }))}
                          aria-label="Moderation note"
                        />
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button type="button" className="btn btn-ghost btn-sm flex-grow-1" disabled={busy} onClick={() => setViewId(analysis._id)}><Eye size={14} className="me-1" />Report</button>
                        <button type="button" className="btn btn-success-soft btn-sm flex-grow-1" disabled={busy || Boolean(pendingNext && nextStatus.status !== 'verified')} onClick={() => applyStatus(f, 'verified')}>
                          {busy && pendingNext && nextStatus.status === 'verified' ? <ButtonSpinner /> : <ShieldCheck size={14} className="me-1" />}Verified
                        </button>
                        <button type="button" className="btn btn-danger-soft btn-sm flex-grow-1" disabled={busy || Boolean(pendingNext && nextStatus.status !== 'suspicious')} onClick={() => applyStatus(f, 'suspicious')}>
                          {busy && pendingNext && nextStatus.status === 'suspicious' ? <ButtonSpinner /> : <ShieldX size={14} className="me-1" />}Suspicious
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm flex-grow-1" disabled={busy || Boolean(pendingNext && nextStatus.status !== 'reviewed')} onClick={() => applyStatus(f, 'reviewed')}>
                          {busy && pendingNext && nextStatus.status === 'reviewed' ? <ButtonSpinner /> : <SearchCheck size={14} className="me-1" />}Reviewed
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="d-flex justify-content-center mt-4"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div>
        </>
      )}
      <AdminViewAnalysisModal analysisId={viewId} onClose={() => setViewId(null)} />
    </div>
  );
}
