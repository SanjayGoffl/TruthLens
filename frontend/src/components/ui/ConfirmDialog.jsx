import { AlertTriangle } from 'lucide-react';
import { ButtonSpinner } from './Loaders';
import Dialog from './Dialog';

export default function ConfirmDialog({ open, title, text, confirmLabel = 'Delete', busy, danger = true, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} label={title} maxWidth={440}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="d-inline-grid place-items-center rounded-3 flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: danger ? 'rgba(220,38,38,.12)' : 'rgba(217,119,6,.12)',
              color: danger ? 'var(--danger)' : 'var(--warning)'
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <h2 className="mb-0" style={{ fontSize: '1.1rem' }}>{title}</h2>
        </div>
        <p className="text-secondary-2 mb-4" style={{ fontSize: 14 }}>{text}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>
            {busy ? <ButtonSpinner /> : null}{confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
