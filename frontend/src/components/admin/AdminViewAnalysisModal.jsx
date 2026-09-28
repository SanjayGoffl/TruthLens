import { useEffect, useState } from 'react';
import { FileSearch, ShieldAlert, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import AnalysisReportView from '../report/AnalysisReportView';
import { SkeletonRows } from '../ui/Loaders';
import { fmtDate } from '../../utils/credibility';
export default function AdminViewAnalysisModal({ analysisId, onClose, afterUpdate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    if (!analysisId) return undefined;
    setData(null);
    setError('');
    api
      .get(`/admin/articles/${analysisId}`)
      .then((res) => {
        if (alive) setData(res.data);
      })
      .catch((err) => {
        if (alive) setError(errorMessage(err, 'Analysis could not be loaded.'));
      });
    return () => {
      alive = false;
    };
  }, [analysisId]);
  if (!analysisId) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(2,6,23,.65)', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }} role="dialog" aria-modal="true" aria-label="Analysis details">
      <div className="card mx-auto w-100" style={{ maxWidth: 1080, marginTop: 24 }}>
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom position-sticky top-0" style={{ background: 'var(--card)', borderColor: 'var(--border)', zIndex: 5 }}>
          <div>
            <h2 className="mb-0" style={{ fontSize: 16 }}>Full analysis report</h2>
            {data ? (
              <div className="text-muted-2 text-xs d-flex flex-wrap gap-2 align-items-center mt-1">
                <span>By {data.analysis.user ? data.analysis.user.name : 'Unknown'} ({data.analysis.user ? data.analysis.user.email : '—'})</span>
                <span>· {fmtDate(data.analysis.createdAt, true)}</span>
                {data.flagged ? <span className="chip chip-amber text-xs"><ShieldAlert size={11} /> {data.flagged.reasons.join(', ')}</span> : null}
              </div>
            ) : null}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-5">
              <span className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.1)' }}><FileSearch size={24} /></span>
              <p className="text-muted-2">{error}</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
            </div>
          ) : !data ? (
            <SkeletonRows rows={10} cols={2} />
          ) : (
            <AnalysisReportView analysis={data.analysis} claims={data.claims} showSave={false} />
          )}
        </div>
      </div>
    </div>
  );
}
