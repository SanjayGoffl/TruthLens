import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, FileSearch, Search, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import VerdictBadge from '../../components/ui/VerdictBadge';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminViewAnalysisModal from '../../components/admin/AdminViewAnalysisModal';
import { SkeletonRows } from '../../components/ui/Loaders';
import { colorForVerdict, domainOf, fmtDate } from '../../utils/credibility';
import { useDebounce } from '../../hooks/useDebounce';
const VERDICTS = ['Highly Credible', 'Mostly Credible', 'Uncertain', 'Potentially Misleading', 'Highly Suspicious'];
export default function ArticlesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounced = useDebounce(search);
  const perPage = 10;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debounced.trim()) params.set('search', debounced.trim());
      if (verdict) params.set('verdict', verdict);
      const res = await api.get(`/admin/articles?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Articles could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, verdict]);
  useEffect(() => {
    load();
  }, [load]);
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/articles/${deleteTarget._id}`);
      toast.success(res.data.message);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the record.'));
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Article analyses</h1>
          <p className="page-subtitle">Browse every analysis record across the platform</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-3 d-flex flex-wrap gap-2 align-items-center border-bottom" style={{ borderColor: 'var(--border)' }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={15} /></span>
            <input className="form-control" placeholder="Search title, publisher, domain…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search articles" />
          </div>
          <select className="form-select" style={{ maxWidth: 210 }} value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }} aria-label="Filter by credibility level">
            <option value="">All credibility levels</option>
            {VERDICTS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className="chip chip-gray ms-auto">{total} analysis{total === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <div className="p-4"><SkeletonRows rows={6} cols={6} /></div>
        ) : error ? (
          <div className="p-5 text-center">
            <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
            <h5>Could not load articles</h5>
            <p className="text-muted-2">{error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={FileSearch} title={search || verdict ? 'No matching analyses' : 'No analyses yet'} text={search || verdict ? 'Try adjusting search or filters.' : 'When users analyze articles, records appear here.'} />
        ) : (
          <div className="table-wrap">
            <table className="table align-middle">
              <thead>
                <tr><th>Article</th><th>User</th><th>Score</th><th>Verdict</th><th>Suspicious</th><th>Mode</th><th>Date</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a._id}>
                    <td style={{ maxWidth: 300 }}>
                      <div className="fw-semibold text-main text-truncate" style={{ fontSize: 13.5 }}>{a.article && a.article.title ? a.article.title : 'Untitled'}</div>
                      <div className="text-muted-2 text-xs text-truncate">{a.article && (a.article.publisher || a.article.domain) ? `${a.article.publisher || ''} ${a.article.domain || ''}`.trim() : 'Pasted content'}</div>
                    </td>
                    <td className="text-muted-2" style={{ fontSize: 13 }}>{a.user ? a.user.name : '—'}</td>
                    <td><span className="font-mono fw-bold" style={{ color: colorForVerdict(a.verdict) }}>{a.overallScore}</span></td>
                    <td><VerdictBadge verdict={a.verdict} size="sm" /></td>
                    <td className="text-muted-2" style={{ fontSize: 13 }}>{a.suspiciousStatements ? a.suspiciousStatements.length : 0}</td>
                    <td><span className="chip chip-gray text-xs">{a.analysisMode === 'ai' ? 'Gemini AI' : 'Heuristic'}</span></td>
                    <td className="text-muted-2" style={{ fontSize: 12.5 }}>{fmtDate(a.createdAt, true)}</td>
                    <td>
                      <div className="d-flex gap-1 justify-content-end">
                        <button type="button" className="btn btn-ghost btn-sm" title="View full analysis" aria-label="View full analysis" onClick={() => setViewId(a._id)}><Eye size={15} /></button>
                        <button type="button" className="btn btn-ghost btn-sm text-danger" title="Delete analysis" aria-label="Delete analysis record" onClick={() => setDeleteTarget(a)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && items.length ? <div className="px-3 pb-3"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div> : null}
      </div>
      <AdminViewAnalysisModal analysisId={viewId} onClose={() => setViewId(null)} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete analysis record?"
        text={deleteTarget ? `"${String(deleteTarget.article && deleteTarget.article.title || 'Untitled').slice(0, 100)}" and its claims will be permanently deleted from the platform.` : ''}
        confirmLabel="Delete record"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
