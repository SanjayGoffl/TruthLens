import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, FileSearch, Globe, Search, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';
import PaginationBar from '../../components/ui/PaginationBar';
import { SkeletonCards } from '../../components/ui/Loaders';
import VerdictBadge from '../../components/ui/VerdictBadge';
import { classNames, colorForScore, fmtDate, sourceClassMeta } from '../../utils/credibility';
import { useDebounce } from '../../hooks/useDebounce';
export default function SourcesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const debounced = useDebounce(search);
  const perPage = 12;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
      if (debounced.trim()) params.set('search', debounced.trim());
      const res = await api.get(`/sources?${params.toString()}`);
      setItems(res.data.items);
      setTotal(res.data.total);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Sources could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);
  useEffect(() => {
    load();
  }, [load]);
  const openDetail = async (id) => {
    setDetailBusy(true);
    setDetail({ id });
    try {
      const res = await api.get(`/sources/${id}`);
      setDetail({ id, ...res.data });
    } catch (err) {
      toast.error(errorMessage(err, 'Source details could not be loaded.'));
      setDetail(null);
    } finally {
      setDetailBusy(false);
    }
  };
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Source Explorer</h1>
          <p className="page-subtitle">Publisher registry — search sources and view reliability information gathered from analyses.</p>
        </div>
      </div>
      <div className="input-group mb-3" style={{ maxWidth: 460 }}>
        <span className="input-group-text"><Search size={15} /></span>
        <input className="form-control" placeholder="Search by name, domain or classification…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search sources" />
        {search ? <button type="button" className="btn btn-ghost" aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button> : null}
      </div>
      {loading ? (
        <SkeletonCards count={6} height={150} />
      ) : error ? (
        <div className="card p-5 text-center">
          <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
          <h5>Could not load sources</h5>
          <p className="text-muted-2" style={{ fontSize: 14 }}>{error}</p>
          <button type="button" className="btn btn-ghost btn-sm mx-auto" onClick={load}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Globe}
            title={search ? 'No sources match your search' : 'No sources in the registry yet'}
            text={search ? 'Try a different keyword — sources are matched by name, domain and classification.' : 'Sources are registered automatically when articles from their domain are analyzed. Admin users can add sources manually.'}
          />
        </div>
      ) : (
        <>
          <div className="row g-3 g-lg-4">
            {items.map((source, idx) => {
              const meta = sourceClassMeta(source.classification);
              return (
                <div className="col-md-6 col-xl-4" key={source._id}>
                  <div className="card card-hover h-100 p-3 p-lg-4">
                    <div className="d-flex align-items-start gap-3">
                      <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: 44, height: 44, background: 'var(--bg-2)', color: 'var(--primary)' }}>
                        <Building2 size={20} />
                      </span>
                      <div className="min-w-0 flex-grow-1">
                        <div className="fw-bold text-main text-truncate" style={{ fontSize: 14.5 }}>{source.name}</div>
                        <div className="text-muted-2 text-xs text-truncate">{source.domain || '—'}</div>
                      </div>
                      <span className="font-mono fw-bold" style={{ color: colorForScore(source.reliabilityScore) }}>{source.reliabilityScore}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <span className={classNames('chip', meta.chip, 'text-xs')}>{source.classification}</span>
                      <span className="chip chip-gray text-xs">{source.analyzedArticles || 0} analyzed</span>
                    </div>
                    {source.notes ? <p className="text-muted-2 text-small mt-2 mb-0" style={{ fontSize: 12.5 }}>{source.notes}</p> : null}
                    <button type="button" className="btn btn-ghost btn-sm w-100 mt-3" onClick={() => openDetail(source._id)}>View details</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="d-flex justify-content-center mt-3"><PaginationBar page={page} total={total} perPage={perPage} onChange={setPage} /></div>
        </>
      )}
      <div className="text-muted-2 mt-3" style={{ fontSize: 12.5 }}>
        Reliability scores and classifications in this registry are informational — they reflect records, editorial conventions and analysis outcomes, and are never presented as an objective measure of a source's truthfulness.
      </div>
      {detail ? (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(2,6,23,.6)', zIndex: 1000 }} role="dialog" aria-modal="true" aria-label="Source details">
          <div className="card w-100" style={{ maxWidth: 720, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom position-sticky top-0" style={{ background: 'var(--card)', borderColor: 'var(--border)', zIndex: 2 }}>
              <h2 className="mb-0" style={{ fontSize: 16.5 }}>Source details</h2>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setDetail(null)}><X size={17} /></button>
            </div>
            <div className="p-4">
              {detailBusy || !detail.source ? (
                <div className="d-flex justify-content-center py-5"><div className="spinner-border text-success" role="status" /></div>
              ) : (
                <>
                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <span className="d-inline-grid place-items-center rounded-3" style={{ width: 52, height: 52, background: 'var(--bg-2)', color: 'var(--primary)' }}><Building2 size={24} /></span>
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold" style={{ fontSize: 17 }}>{detail.source.name}</div>
                      <div className="text-muted-2 text-small">{detail.source.domain}</div>
                    </div>
                    <span className={classNames('chip', sourceClassMeta(detail.source.classification).chip)}>{detail.source.classification}</span>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-3 col-6">
                      <div className="p-3 rounded-3 h-100" style={{ background: 'var(--bg-2)' }}>
                        <div className="font-mono fw-bold" style={{ color: colorForScore(detail.source.reliabilityScore) }}>{detail.source.reliabilityScore}/100</div>
                        <div className="text-muted-2 text-xs">Reliability score</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-3 rounded-3 h-100" style={{ background: 'var(--bg-2)' }}>
                        <div className="fw-bold">{detail.analyzedArticles || 0}</div>
                        <div className="text-muted-2 text-xs">Analyzed articles</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-3 rounded-3 h-100" style={{ background: 'var(--bg-2)' }}>
                        <div className="fw-bold">{detail.source.category || 'News'}</div>
                        <div className="text-muted-2 text-xs">Category</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-3 rounded-3 h-100" style={{ background: 'var(--bg-2)' }}>
                        <div className="fw-bold">{fmtDate(detail.source.createdAt)}</div>
                        <div className="text-muted-2 text-xs">Registered</div>
                      </div>
                    </div>
                  </div>
                  {detail.source.notes ? <p className="text-secondary-2" style={{ fontSize: 13.5 }}>{detail.source.notes}</p> : null}
                  <h3 className="mt-3 mb-2" style={{ fontSize: 14 }}>Recent analyses from this source</h3>
                  {detail.recent && detail.recent.length ? (
                    <div className="d-grid gap-2">
                      {detail.recent.map((a) => (
                        <div key={a._id} className="d-flex align-items-center gap-2 p-2 rounded-3" style={{ background: 'var(--bg-2)' }}>
                          <span className="font-mono fw-bold flex-shrink-0" style={{ color: colorForScore(a.overallScore), width: 34 }}>{a.overallScore}</span>
                          <VerdictBadge verdict={a.verdict} size="sm" />
                          <div className="flex-grow-1 min-w-0">
                            <div className="text-main text-truncate fw-semibold" style={{ fontSize: 13 }}>{a.article && a.article.title}</div>
                            <div className="text-muted-2 text-xs">{fmtDate(a.createdAt)}</div>
                          </div>
                          {a.article && a.article.url ? <a href={a.article.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label="Open original article">Open</a> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-2 text-small mb-0">No articles from this domain have been analyzed yet.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
