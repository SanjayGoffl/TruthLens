import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark, Download, Eye, FileSearch, History, RefreshCw, Search, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import VerdictBadge from '../ui/VerdictBadge';
import EmptyState from '../ui/EmptyState';
import PaginationBar from '../ui/PaginationBar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ButtonSpinner, SkeletonRows } from '../ui/Loaders';
import { classNames, colorForVerdict, downloadBlob, fmtDate } from '../../utils/credibility';
import { useDebounce } from '../../hooks/useDebounce';
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'score-desc', label: 'Score: high → low' },
  { value: 'score-asc', label: 'Score: low → high' }
];
export default function AnalysisListTable({ savedOnly = false, title, subtitle, emptyTitle, emptyText, onListChanged }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [verdict, setVerdict] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const debounced = useDebounce(search);
  const perPage = 10;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage), sort });
      if (debounced.trim()) params.set('search', debounced.trim());
      if (verdict) params.set('verdict', verdict);
      if (savedOnly) params.set('saved', 'true');
      const res = await api.get(`/analysis/history?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Analysis history could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced, verdict, sort, savedOnly]);
  useEffect(() => {
    load();
  }, [load]);
  const action = async (kind, item) => {
    setBusyId(item._id);
    try {
      if (kind === 'save') {
        const res = await api.post(`/analysis/${item._id}/save`);
        toast.success(res.data.message);
      } else if (kind === 'unsave') {
        const res = await api.delete(`/analysis/${item._id}/save`);
        toast.success(res.data.message);
      } else if (kind === 'pdf') {
        const res = await api.get(`/analysis/${item._id}/report`, { responseType: 'blob' });
        const title = item.article && item.article.title ? item.article.title : 'article';
        downloadBlob(res.data, `truthlens-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'report'}.pdf`);
        toast.success('PDF report downloaded.');
      } else if (kind === 'reanalyze') {
        const res = await api.post(`/analysis/${item._id}/reanalyze`);
        toast.success('Article reanalyzed.');
        window.location.assign(`/user/result/${res.data.analysisId}`);
      }
      if (kind === 'save' || kind === 'unsave') {
        load();
        if (onListChanged) onListChanged();
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Action failed.'));
    } finally {
      setBusyId('');
    }
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/analysis/${deleteId}`);
      toast.success('Analysis deleted.');
      setDeleteId(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
      if (onListChanged) onListChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the analysis.'));
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="p-3 d-flex flex-wrap gap-2 align-items-center border-bottom" style={{ borderColor: 'var(--border)' }}>
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-group-text"><Search size={15} /></span>
            <input className="form-control" placeholder="Search by title, source or domain…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search analyses" />
          </div>
          <select className="form-select" style={{ maxWidth: 210 }} value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(1); }} aria-label="Filter by verdict">
            <option value="">All verdicts</option>
            {['Highly Credible', 'Mostly Credible', 'Uncertain', 'Potentially Misleading', 'Highly Suspicious'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select className="form-select" style={{ maxWidth: 190 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort order">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <span className="chip chip-gray ms-auto">{total} result{total === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <div className="p-4"><SkeletonRows rows={6} cols={5} /></div>
        ) : error ? (
          <div className="p-5 text-center">
            <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
            <h5>Could not load records</h5>
            <p className="text-muted-2" style={{ fontSize: 14 }}>{error}</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={History}
            title={search || verdict ? 'No matching results' : emptyTitle}
            text={search || verdict ? 'Try a different search term or filter.' : emptyText}
          />
        ) : (
          <div className="table-wrap">
            <table className="table table-stack align-middle">
              <thead>
                <tr><th>Article</th><th>Source</th><th>Score</th><th>Verdict</th><th>Date</th><th className="text-end">Actions</th></tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const busy = busyId === item._id;
                  return (
                    <tr key={item._id}>
                      <td style={{ maxWidth: 300 }}>
                        <div className="fw-semibold text-main text-truncate" style={{ fontSize: 13.5 }}>{item.article && item.article.title ? item.article.title : 'Untitled article'}</div>
                        <div className="text-muted-2 text-xs">{item.analysisMode === 'ai' ? 'Gemini AI' : 'Heuristic'} analysis</div>
                      </td>
                      <td style={{ fontSize: 13 }} className="text-muted-2">{item.article && (item.article.publisher || item.article.domain) || 'Pasted content'}</td>
                      <td><span className="font-mono fw-bold" style={{ color: colorForVerdict(item.verdict) }}>{item.overallScore}</span></td>
                      <td><VerdictBadge verdict={item.verdict} size="sm" /></td>
                      <td className="text-muted-2" style={{ fontSize: 12.5 }}>{fmtDate(item.createdAt, true)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end flex-wrap">
                          <Link to={`/user/result/${item._id}`} className="btn btn-ghost btn-sm" title="View report" aria-label={`View report for ${item.article && item.article.title}`}>
                            <Eye size={15} />
                          </Link>
                          <button type="button" className="btn btn-ghost btn-sm" title="Download PDF" aria-label="Download PDF report" disabled={busy} onClick={() => action('pdf', item)}>
                            {busy ? <ButtonSpinner /> : <Download size={15} />}
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" title="Reanalyze article" aria-label={`Reanalyze ${item.article && item.article.title}`} disabled={busy} onClick={() => action('reanalyze', item)}>
                            {busy ? <ButtonSpinner /> : <RefreshCw size={15} />}
                          </button>
                          {savedOnly ? (
                            <button type="button" className="btn btn-ghost btn-sm" title="Remove from saved" aria-label="Remove from saved reports" disabled={busy} onClick={() => action('unsave', item)}>
                              <Bookmark size={15} className="text-muted-2" />
                            </button>
                          ) : (
                            <button type="button" className={classNames('btn btn-ghost btn-sm', item.isSaved && 'btn-success-soft')} title={item.isSaved ? 'Saved — click to remove' : 'Save report'} aria-label="Toggle saved report" disabled={busy} onClick={() => action('save', item)}>
                              <Bookmark size={15} />
                            </button>
                          )}
                          <button type="button" className="btn btn-ghost btn-sm text-danger" title="Delete analysis" aria-label="Delete analysis" disabled={busy} onClick={() => setDeleteId(item._id)}>
                            <Trash2 size={15} />
                          </button>
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
        open={Boolean(deleteId)}
        title="Delete this analysis?"
        text="The analysis, its claims and PDF records will be permanently removed. This cannot be undone."
        confirmLabel="Delete permanently"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
