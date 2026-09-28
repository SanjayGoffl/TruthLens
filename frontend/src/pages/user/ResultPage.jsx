import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import AnalysisReportView from '../../components/report/AnalysisReportView';
import { SkeletonRows } from '../../components/ui/Loaders';
import { useAuth } from '../../context/AuthContext';
export default function ResultPage() {
  const { id } = useParams();
  const { refreshProfile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analysis/${id}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'This analysis could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  const onSavedChange = () => refreshProfile();
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Credibility report</h1>
          <p className="page-subtitle">Full analysis with factors, claims and evidence</p>
        </div>
        <Link to="/user/history" className="btn btn-ghost"><ArrowLeft size={16} className="me-2" />Back to history</Link>
      </div>
      {loading ? (
        <div className="card p-4"><SkeletonRows rows={9} cols={3} /></div>
      ) : error ? (
        <div className="card p-5 text-center">
          <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--warning)', background: 'rgba(217,119,6,.12)' }}><FileQuestion size={26} /></span>
          <h5>Report unavailable</h5>
          <p className="text-muted-2" style={{ fontSize: 14 }}>{error}</p>
          <div className="d-flex justify-content-center gap-2">
            <Link to="/user/history" className="btn btn-primary btn-sm">Go to history</Link>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>Try again</button>
          </div>
        </div>
      ) : data ? (
        <AnalysisReportView analysis={data.analysis} claims={data.claims} onSavedChange={onSavedChange} />
      ) : null}
    </div>
  );
}
