import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowRight, FileSearch, Flag, Gauge, Globe, ShieldAlert, Users } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCards, SkeletonRows } from '../../components/ui/Loaders';
import { ChartBar, ChartLine, ChartDoughnut } from '../../components/ui/Charts';
import { colorForVerdict, fmtDate } from '../../utils/credibility';
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [flagged, setFlagged] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ana, flag] = await Promise.all([api.get('/admin/analytics?range=14'), api.get('/admin/flagged?page=1&limit=5&status=pending')]);
      setData(ana.data);
      setFlagged(flag.data);
    } catch (err) {
      setError(errorMessage(err, 'Dashboard could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (loading) {
    return (
      <div>
        <h1 className="page-title mb-1">Admin dashboard</h1>
        <p className="page-subtitle mb-4">Platform-wide overview</p>
        <SkeletonCards count={4} height={110} />
        <div className="card mt-4 p-4"><SkeletonRows rows={6} cols={3} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card p-5 text-center mt-3">
        <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><AlertOctagon size={26} /></span>
        <h5>Could not load platform data</h5>
        <p className="text-muted-2">{error}</p>
        <div><button type="button" className="btn btn-primary btn-sm" onClick={load}>Try again</button></div>
      </div>
    );
  }
  const s = data.summary;
  const totalUsers = s.totalUsers;
  const dist = data.distribution;
  return (
    <div>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-4">
        <div>
          <h1 className="page-title">Admin dashboard</h1>
          <p className="page-subtitle">Real platform statistics from MongoDB</p>
        </div>
        <Link to="/admin/analytics" className="btn btn-ghost">Full analytics <ArrowRight size={15} className="ms-1" /></Link>
      </div>
      <div className="row g-3">
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={Users} value={totalUsers} label="Total Users" sub={`${s.activeUsers} active`} iconBg="#0EA5E9" /></div>
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={FileSearch} value={s.totalAnalyses} label="Total Analyses" sub={`${s.analysesToday} today`} iconBg="#6366F1" /></div>
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={Gauge} value={s.averageScore} label="Avg. Score" sub="/100 across all" iconBg="#8B5CF6" /></div>
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={Flag} value={s.flaggedPending} label="Flagged Pending" sub="awaiting review" iconBg="#D97706" /></div>
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={Globe} value={s.suspiciousSources} label="High-Risk Sources" sub="in registry" iconBg="#DC2626" /></div>
        <div className="col-6 col-md-4 col-xl-2"><StatCard icon={AlertOctagon} value={`${s.suspiciousPercentage}%`} label="Suspicious Share" sub="of analyses" iconBg="#EA580C" /></div>
      </div>
      <div className="row g-4 mt-1">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Daily analysis activity — last 14 days</div>
            <div className="card-body p-4">
              <ChartLine
                labels={data.series.daily.map((d) => d.date.slice(5))}
                series={[
                  { label: 'Analyses', data: data.series.daily.map((d) => d.count), color: '#6366F1', fill: true },
                  { label: 'Average score', data: data.series.daily.map((d) => d.avg), color: '#0EA5E9' }
                ]}
                height={270}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Verdict distribution</div>
            <div className="card-body p-4 d-flex align-items-center">
              <ChartDoughnut
                labels={dist.verdict.map((v) => v.label)}
                data={dist.verdict.map((v) => v.count)}
                colors={dist.verdict.map((v) => colorForVerdict(v.label))}
                height={250}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Credibility distribution</div>
            <div className="card-body p-4">
              <ChartBar
                labels={dist.credibility.map((d) => d.level)}
                series={[{ label: 'Analyses', data: dist.credibility.map((d) => d.count), color: '#4F46E5' }]}
                options={{ scales: { x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10.5 } } }, y: { beginAtZero: true, grid: { color: '#E8EEF3' }, ticks: { color: '#94A3B8', font: { size: 10.5 }, precision: 0 } } } }}
                height={210}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Most analyzed domains</div>
            <div className="card-body p-4">
              {data.topDomains.length ? (
                <ChartBar
                  labels={data.topDomains.map((d) => d.domain || 'unknown')}
                  series={[{ label: 'Analyses', data: data.topDomains.map((d) => d.count), color: '#6366F1' }]}
                  options={{ indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#E8EEF3' }, ticks: { color: '#94A3B8', font: { size: 10.5 }, precision: 0 } }, y: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10.5 } } } } }}
                  height={210}
                />
              ) : (
                <EmptyState icon={Globe} title="No domain data yet" text="Analyzed articles will appear here by domain." />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="card mt-4 overflow-hidden">
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom" style={{ borderColor: 'var(--border)' }}>
          <span className="fw-bold d-inline-flex align-items-center gap-2" style={{ fontSize: 14.5 }}><ShieldAlert size={16} className="text-warning" />Flagged articles awaiting review</span>
          <Link to="/admin/flagged" className="btn btn-ghost btn-sm">Review queue <ArrowRight size={14} /></Link>
        </div>
        {flagged && flagged.items.length ? (
          <div className="table-wrap">
            <table className="table align-middle">
              <thead><tr><th>Article</th><th>User</th><th>Score</th><th>Reasons</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {flagged.items.map((f) => (
                  <tr key={f._id}>
                    <td className="fw-semibold text-main text-truncate" style={{ maxWidth: 300, fontSize: 13.5 }}>
                      {f.analysis && f.analysis.article && f.analysis.article.title ? f.analysis.article.title : 'Untitled'}
                    </td>
                    <td className="text-muted-2" style={{ fontSize: 13 }}>{f.user ? f.user.name : '—'}</td>
                    <td><span className="font-mono fw-bold" style={{ color: colorForVerdict(f.analysis ? f.analysis.verdict : 'Uncertain') }}>{f.analysis ? f.analysis.overallScore : '—'}</span></td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {(f.reasons || []).slice(0, 2).map((r) => <span key={r} className="chip chip-amber text-xs">{r}</span>)}
                      </div>
                    </td>
                    <td className="text-muted-2" style={{ fontSize: 12.5 }}>{fmtDate(f.createdAt)}</td>
                    <td><Link to="/admin/flagged" className="btn btn-ghost btn-sm">Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ShieldAlert} title="No flagged articles pending" text="When an analysis is auto-flagged for low credibility, unsupported claims or suspicious language, it will appear here." />
        )}
      </div>
      {data.topUsers && data.topUsers.length ? (
        <div className="card mt-4 overflow-hidden">
          <div className="px-4 py-3 border-bottom fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Most active users</div>
          <div className="table-wrap">
            <table className="table align-middle">
              <thead><tr><th>User</th><th>Email</th><th>Analyses</th><th>Average score</th></tr></thead>
              <tbody>
                {data.topUsers.map((u) => (
                  <tr key={`${u.email}-${u.count}`}>
                    <td className="fw-semibold">{u.name}</td>
                    <td className="text-muted-2" style={{ fontSize: 13 }}>{u.email}</td>
                    <td>{u.count}</td>
                    <td>{u.avg}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
