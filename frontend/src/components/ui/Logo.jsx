import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { classNames } from '../../utils/credibility';
export default function Logo({ dark, onClick, size = 32, className }) {
  return (
    <Link to="/" onClick={onClick} className={classNames('d-inline-flex align-items-center gap-2 text-decoration-none cursor-pointer', className)} aria-label="TruthLens AI home">
      <span className="d-inline-grid place-items-center rounded-3 flex-shrink-0" style={{ width: size, height: size, background: 'linear-gradient(135deg,#4F46E5,#4338CA)', color: '#fff' }}>
        <ShieldCheck size={Math.round(size * 0.58)} strokeWidth={2.4} />
      </span>
      <span className={classNames('font-display fw-bold lh-sm', dark ? 'text-white' : 'text-main')} style={{ fontSize: Math.round(size * 0.55), letterSpacing: '-0.01em' }}>
        TruthLens <span className="text-gradient-emerald">AI</span>
      </span>
    </Link>
  );
}
