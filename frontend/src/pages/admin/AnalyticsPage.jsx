import { useCallback, useEffect, useState } from 'react';
import { BarChart3, FileSearch, Flag, Gauge, Globe, TrendingUp, Users } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCards, SkeletonRows } from '../../components/ui/Loaders';
import { ChartBar, ChartLine, ChartDoughnut } from '../../components/ui/Charts';
import { colorForVerdict } from '../../utils/credibility';
export default function AnalyticsPage() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?range=${range}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Analytics could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => {
    load();
  }, [load]);
  if (loading) {
    return (
      <div>
        <h1 className="page-title mb-4">Analytics</h1>
        <SkeletonCards count={4} height={110} />
        <div className="card mt-4 p-4"><SkeletonRows rows={8} cols={3} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="card p-5 text-center">
        <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
        <h5>Analytics unavailable</h5>
        <p className="text-muted-2">{error}</p>
        <button type="button" className="btn btn-primary btn-sm mx-auto" onClick={load}>Retry</button>
      </div>
    );
  }
  const s = data.summary;
  const noData = s.totalAnalyses === 0;
  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="page-title">Platform analytics</h1>
          <p className="page-subtitle">Trends computed live from MongoDB</p>
        </div>
        <div className="d-flex gap-1" role="group" aria-label="Time range">
          {[7, 30, 90].map((r) => (
            <button key={r} type="button" className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setRange(r)}>Last {r} days</button>
          ))}
        </div>
      </div>
      <div className="row g-3">
        <div className="col-6 col-md-3"><StatCard icon={BarChart3} value={s.totalAnalyses} label="Total analyses" iconBg="#6366F1" /></div>
        <div className="col-6 col-md-3"><StatCard icon={Gauge} value={s.averageScore} label="Average score" sub="/100" iconBg="#0EA5E9" /></div>
        <div className="col-6 col-md-3"><StatCard icon={Flag} value={`${s.suspiciousPercentage}%`} label="Suspicious share" sub={`${s.suspiciousCount} analyses`} iconBg="#EA580C" /></div>
        <div className="col-6 col-md-3"><StatCard icon={Users} value={s.activeUsers} label="Active users" sub={`${s.totalUsers} total`} iconBg="#8B5CF6" /></div>
      </div>
      {noData ? (
        <div className="card mt-4">
          <EmptyState icon={TrendingUp} title="No data to chart yet" text="Analyses from registered users will feed these charts automatically — every statistic here is real database output." />
        </div>
      ) : (
        <>
          <div className="row g-4 mt-1">
            <div className="col-lg-8">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Daily analysis activity — last {range} days</div>
                <div className="card-body p-4">
                  <ChartLine
                    labels={data.series.daily.map((d) => d.date)}
                    series={[
                      { label: 'Analyses', data: data.series.daily.map((d) => d.count), color: '#6366F1', fill: true },
                      { label: 'Average score', data: data.series.daily.map((d) => d.avg), color: '#0EA5E9' }
                    ]}
                    height={280}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Credibility distribution</div>
                <div className="card-body p-4">
                  <ChartDoughnut
                    labels={data.distribution.credibility.map((d) => d.level)}
                    data={data.distribution.credibility.map((d) => d.count)}
                    colors={data.distribution.credibility.map((d) => ({ '80-100': '#16A34A', '65-79': '#4F46E5', '45-64': '#D97706', '25-44': '#EA580C', '0-24': '#DC2626' })[d.level] || '#64748B')}
                    height={250}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Monthly analysis trend</div>
                <div className="card-body p-4">
                  <ChartBar
                    labels={data.series.monthly.map((m) => m.month)}
                    series={[{ label: 'Analyses', data: data.series.monthly.map((m) => m.count), color: '#4F46E5' }]}
                    height={260}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Verdict breakdown</div>
                <div className="card-body p-4">
                  <ChartDoughnut
                    labels={data.distribution.verdict.map((v) => v.label)}
                    data={data.distribution.verdict.map((v) => v.count)}
                    colors={data.distribution.verdict.map((v) => colorForVerdict(v.label))}
                    height={250}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Most analyzed domains</div>
                <div className="card-body p-4">
                  {data.topDomains.length ? (
                    <ChartBar
                      labels={data.topDomains.map((d) => d.domain || 'unknown')}
                      series={[{ label: 'Analyses', data: data.topDomains.map((d) => d.count), color: '#6366F1' }]}
                      options={{ indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#E8EEF3' }, ticks: { color: '#94A3B8', font: { size: 10 }, precision: 0 } }, y: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10 } } } } }}
                      height={Math.max(140, data.topDomains.length * 42)}
                    />
                  ) : (
                    <EmptyState icon={Globe} title="No domain data" text="Analyzed articles will appear here by domain." />
                  )}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Most active users</div>
                <div className="card-body p-4">
                  {data.topUsers.length ? (
                    <ChartBar
                      labels={data.topUsers.map((u) => (u.name || 'Unknown').split(' ')[0])}
                      series={[{ label: 'Analyses', data: data.topUsers.map((u) => u.count), color: '#8B5CF6' }]}
                      options={{ indexAxis: 'y', scales: { x: { beginAtZero: true, grid: { color: '#E8EEF3' }, ticks: { color: '#94A3B8', font: { size: 10 }, precision: 0 } }, y: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10 } } } } }}
                      height={Math.max(140, data.topUsers.length * 42)}
                    />
                  ) : (
                    <EmptyState icon={Users} title="No user activity" text="Users who analyze articles will appear here." />
                  )}
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-transparent border-bottom px-4 py-3 fw-bold" style={{ fontSize: 14.5, borderColor: 'var(--border)' }}>Flagged article trend — last {range} days</div>
                <div className="card-body p-4">
                  {data.flaggedTrend.length ? (
                    <ChartLine
                      labels={data.flaggedTrend.map((d) => d.date)}
                      series={[{ label: 'Newly flagged', data: data.flaggedTrend.map((d) => d.count), color: '#DC2626', fill: true }]}
                      height={230}
                    />
                  ) : (
                    <EmptyState icon={Flag} title="No flags in this period" text="Auto-flagged analyses will appear here over time." />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
