import { LockKeyhole } from 'lucide-react';
export default function NotifSwitchRow({ id, icon: Icon, title, desc, checked, disabled, locked, onChange }) {
  return (
    <div className="d-flex align-items-start justify-content-between gap-3 py-2" style={{ borderBottom: '1px dashed var(--border)' }}>
      <div className="d-flex align-items-start gap-2 min-w-0">
        <Icon size={15} className={`flex-shrink-0 mt-1 ${disabled ? 'text-muted-2' : 'text-success'}`} />
        <div className="min-w-0">
          <div className="fw-semibold text-main text-small d-flex align-items-center gap-1 flex-wrap">
            {title}
            {locked ? <LockKeyhole size={11} className="text-muted-2" /> : null}
          </div>
          <div className="text-muted-2 text-xs">{desc}</div>
        </div>
      </div>
      <div className="form-check form-switch flex-shrink-0 mt-1">
        <input id={id} className="form-check-input" type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <label className="form-check-label d-none" htmlFor={id}>{title}</label>
      </div>
    </div>
  );
}
