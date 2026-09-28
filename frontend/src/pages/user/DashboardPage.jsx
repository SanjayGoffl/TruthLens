import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScanSearch } from 'lucide-react';
import { AlertOctagon, ArrowRight, Bookmark, FileSearch, Gauge, History, ShieldCheck, ShieldX, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import VerdictBadge from '../../components/ui/VerdictBadge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCards, SkeletonRows } from '../../components/ui/Loaders';
import { ChartLine, ChartDoughnut } from '../../components/ui/Charts';
import { fmtDate, colorForVerdict } from '../../utils/credibility';
import { useAuth } from '../../context/AuthContext';
export default function DashboardPage() {
  const { refreshProfile, user } = useAuth();
  const [quickUrl, setQuickUrl] = useState('');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analysis/summary');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Dashboard data could not be loaded.'));
    } finally {
      setLoading(false);
    }
    refreshProfile();
  }, [refreshProfile]);
  useEffect(() => {
    load();
  }, [load]);
  const verdictSeries = Object.entries((data && data.verdictCounts) || {}).map(([label, count]) => ({ label, count }));
  if (loading) {
    return (
      <div>
        <h1 className="page-title mb-1">Dashboard</h1>
        <p className="page-subtitle mb-4">Your analysis overview</p>
        <SkeletonCards count={6} height={110} />
        <div className="card mt-4 p-4"><SkeletonRows rows={6} cols={3} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <h1 className="page-title mb-4">Dashboard</h1>
        <div className="card p-5 text-center">
          <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><AlertOctagon size={26} /></span>
          <h5>Could not load your dashboard</h5>
          <p className="text-muted-2">{error}</p>
          <div><button type="button" className="btn btn-primary btn-sm" onClick={load}>Try again</button></div>
        </div>
      </div>
    );
  }
  const s = data.stats;
  const hasData = s.totalAnalyses > 0;
  return (
    <div>
      <div className="analyze-hero mb-4">
        <h1 className="page-title mb-1">Welcome back{user && user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="page-subtitle mb-3">Check an article in seconds — paste a link or open the full analyzer for pasted text.</p>
        <form
          className="d-flex flex-column flex-sm-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = quickUrl.trim();
            if (/^https?:\/\//i.test(v)) navigate(`/user/analyze?url=${encodeURIComponent(v)}`, { state: { auto: true } });
            else navigate('/user/analyze');
          }}
        >
          <input className="form-control form-control-lg" inputMode="url" placeholder="https://news-site.com/article…" value={quickUrl} onChange={(e) => setQuickUrl(e.target.value)} aria-label="Article URL" />
          <button type="submit" className="btn btn-primary btn-lg flex-shrink-0"><ScanSearch size={18} className="me-2" />Analyze</button>
        </form>
      </div>
      <div className="row g-3 g-lg-4">
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={FileSearch} value={s.totalAnalyses} label="Total Analyses" sub="all time" iconBg="#6366F1" /></div>
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={Gauge} value={s.totalAnalyses ? `${s.averageScore}` : '—'} label="Avg. Score" sub="/100 across reports" iconBg="#0EA5E9" /></div>
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={ShieldCheck} value={s.highlyCredible} label="Highly Credible" sub="80–100 band" iconBg="#16A34A" /></div>
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={AlertOctagon} value={s.potentiallyMisleading} label="Misleading Band" sub="25–44 band" iconBg="#EA580C" /></div>
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={ShieldX} value={s.highlySuspicious} label="Suspicious" sub="0–24 band" iconBg="#DC2626" /></div>
        <div className="col-6 col-xl-2 col-md-4"><StatCard icon={Bookmark} value={s.savedReports} label="Saved Reports" sub="bookmarked" iconBg="#8B5CF6" /></div>
      </div>
      {!hasData ? (
        <div className="card mt-4">
          <EmptyState
            icon={History}
            title="No analyses yet"
            text="Run your first credibility analysis to see trends, verdict distribution and activity charts here."
            action={<button type="button" className="btn btn-primary" onClick={() => navigate('/user/analyze')}>Analyze an article <ArrowRight size={15} className="ms-1" /></button>}
          />
        </div>
      ) : (
        <>
          <div className="row g-4 mt-1">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Credibility trend — last 14 days</div>
                <div className="card-body p-4">
                  <ChartLine
                    labels={data.trend.map((t) => t.date.slice(5))}
                    series={[{ label: 'Analyses', data: data.trend.map((t) => t.count), color: '#6366F1', fill: true }]}
                    height={250}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Verdict distribution</div>
                <div className="card-body p-4">
                  <ChartDoughnut
                    labels={verdictSeries.map((v) => v.label)}
                    data={verdictSeries.map((v) => v.count)}
                    colors={verdictSeries.map((v) => colorForVerdict(v.label))}
                    height={250}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="card mt-4 overflow-hidden">
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
              <div className="fw-bold" style={{ fontSize: 14.5 }}>Recent analyses</div>
              <Link to="/user/history" className="btn btn-ghost btn-sm">View all <ArrowRight size={14} /></Link>
            </div>
            {data.recent.length ? (
              <div className="table-wrap">
                <table className="table table-stack align-middle">
                  <thead>
                    <tr><th>Article</th><th>Source</th><th>Score</th><th>Verdict</th><th>Date</th><th></th></tr>
                  </thead>
                  <tbody>
                    {data.recent.map((a) => (
                      <tr key={a._id}>
                        <td style={{ maxWidth: 320 }}>
                          <div className="fw-semibold text-main text-truncate">{a.article && a.article.title ? a.article.title : 'Untitled'}</div>
                          {a.article && a.article.url ? <a href={a.article.url} target="_blank" rel="noreferrer" className="text-muted-2 text-xs text-truncate d-inline-block" style={{ maxWidth: 280 }}>{a.article.url}</a> : null}
                        </td>
                        <td className="text-muted-2" style={{ fontSize: 13 }}>{a.article && (a.article.publisher || a.article.domain) || 'Pasted content'}</td>
                        <td><span className="font-mono fw-bold" style={{ color: colorForVerdict(a.verdict) }}>{a.overallScore}</span></td>
                        <td><VerdictBadge verdict={a.verdict} size="sm" /></td>
                        <td className="text-muted-2" style={{ fontSize: 13 }}>{fmtDate(a.createdAt)}</td>
                        <td><Link to={`/user/result/${a._id}`} className="btn btn-ghost btn-sm">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={History} title="No recent analyses" text="Your completed analyses will appear here." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
