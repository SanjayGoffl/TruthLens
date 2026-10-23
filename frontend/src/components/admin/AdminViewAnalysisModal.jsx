import { useEffect, useState } from 'react';
import { FileSearch, ShieldAlert, X } from 'lucide-react';
import api, { errorMessage } from '../../services/api';
import AnalysisReportView from '../report/AnalysisReportView';
import { SkeletonRows } from '../ui/Loaders';
import Dialog from '../ui/Dialog';
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
  return (
    <Dialog open={Boolean(analysisId)} onClose={onClose} label="Analysis details" align="start" maxWidth={1080}>
      <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom" style={{ borderColor: 'var(--border)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 5 }}>
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
    </Dialog>
  );
}
