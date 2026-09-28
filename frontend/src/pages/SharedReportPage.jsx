import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FileQuestion } from 'lucide-react';
import AnalysisReportView from '../components/report/AnalysisReportView';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/ui/ThemeToggle';
import { SkeletonRows } from '../components/ui/Loaders';

export default function SharedReportPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    axios.get(`/api/public/report/${encodeURIComponent(token)}`)
      .then((res) => setData(res.data))
      .catch((err) => setError((err.response && err.response.data && err.response.data.message) || 'This report could not be loaded.'));
  }, [token]);
  return (
    <div style={{ minHeight: '100vh' }}>
      <header className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
        <Logo />
        <div className="d-flex align-items-center gap-2">
          <ThemeToggle />
          <Link to="/register" className="btn btn-primary btn-sm">Analyze your own article</Link>
        </div>
      </header>
      <main className="container pb-5" style={{ maxWidth: 1080 }}>
        <p className="text-muted-2 text-small">Shared credibility report (read-only)</p>
        {error ? (
          <div className="card p-5 text-center">
            <FileQuestion size={28} className="mx-auto mb-2" style={{ color: 'var(--warning)' }} />
            <h5>Report unavailable</h5>
            <p className="text-muted-2 mb-0">{error}</p>
          </div>
        ) : data ? (
          <AnalysisReportView analysis={data.analysis} claims={data.claims} readOnly />
        ) : (
          <div className="card p-4"><SkeletonRows rows={8} cols={3} /></div>
        )}
      </main>
    </div>
  );
}
