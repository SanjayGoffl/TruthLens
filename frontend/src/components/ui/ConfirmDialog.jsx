import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ButtonSpinner } from './Loaders';
export default function ConfirmDialog({ open, title, text, confirmLabel = 'Delete', busy, danger = true, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(2,6,23,.6)', zIndex: 2000, padding: '1rem' }} role="dialog" aria-modal="true" aria-label={title}>
      <div className="card w-100" style={{ maxWidth: 440, borderRadius: 16 }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: 44, height: 44, background: danger ? 'rgba(220,38,38,.12)' : 'rgba(217,119,6,.12)', color: danger ? 'var(--danger)' : 'var(--warning)' }}>
              <AlertTriangle size={22} />
            </div>
            <h5 className="mb-0">{title}</h5>
          </div>
          <p className="text-secondary-2 mb-4" style={{ fontSize: 14 }}>{text}</p>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancel</button>
            <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>
              {busy ? <ButtonSpinner /> : null}{confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
