import { Link, useNavigate } from 'react-router-dom';
import { FileText, Gauge, Scale, SearchCheck, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';
import { goSection } from '../../utils/scroll';
export default function PublicFooter() {
  const navigate = useNavigate();
  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
      <div className="py-5 px-3 px-lg-4" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="row g-4">
          <div className="col-lg-5">
            <Logo size={34} />
            <p className="text-secondary-2 mt-3 mb-3" style={{ fontSize: 14, maxWidth: 380 }}>
              AI-powered news credibility analysis. Submit a URL or paste an article, and understand the source, claims, evidence and writing patterns behind the story — with a transparent, explainable score.
            </p>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Start analyzing</button>
              <span className="chip chip-green pill"><ShieldCheck size={13} /> Transparency first</span>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-2">
            <h6 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Explore</h6>
            <ul className="list-unstyled d-grid gap-2" style={{ fontSize: 14 }}>
              <li><button type="button" className="btn btn-link p-0 link-plain" onClick={() => goSection('how-it-works')}>How it works</button></li>
              <li><button type="button" className="btn btn-link p-0 link-plain" onClick={() => goSection('features')}>Features</button></li>
              <li><button type="button" className="btn btn-link p-0 link-plain" onClick={() => goSection('credibility')}>Credibility levels</button></li>
              <li><button type="button" className="btn btn-link p-0 link-plain" onClick={() => goSection('about')}>About</button></li>
              <li><button type="button" className="btn btn-link p-0 link-plain" onClick={() => goSection('faq')}>FAQ</button></li>
            </ul>
          </div>
          <div className="col-6 col-md-3 col-lg-2">
            <h6 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Product</h6>
            <ul className="list-unstyled d-grid gap-2" style={{ fontSize: 14 }}>
              <li><Link to="/user/analyze" className="link-plain">Analyze an article</Link></li>
              <li><Link to="/user/sources" className="link-plain">Source explorer</Link></li>
              <li><Link to="/login" className="link-plain">Log in</Link></li>
              <li><Link to="/register" className="link-plain">Create account</Link></li>
            </ul>
          </div>
          <div className="col-12 col-md-3 col-lg-3">
            <h6 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>How analysis works</h6>
            <ul className="list-unstyled d-grid gap-2 text-secondary-2" style={{ fontSize: 13.5 }}>
              <li className="d-flex gap-2 align-items-start"><Gauge size={15} className="flex-shrink-0 mt-1 text-success" /> Weighted credibility score with full factor breakdown</li>
              <li className="d-flex gap-2 align-items-start"><Scale size={15} className="flex-shrink-0 mt-1 text-success" /> Claim-level assessment, never blanket true/false verdicts</li>
              <li className="d-flex gap-2 align-items-start"><FileText size={15} className="flex-shrink-0 mt-1 text-success" /> Downloadable PDF credibility reports</li>
            </ul>
          </div>
        </div>
        <hr className="divider my-4" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <div className="text-muted-2 text-small">© {new Date().getFullYear()} TruthLens AI. Analyze. Verify. Understand the Truth.</div>
          <div className="d-flex gap-4">
            <Link to="/terms" className="text-muted-2 text-small link-plain">Terms &amp; Conditions</Link>
            <Link to="/privacy" className="text-muted-2 text-small link-plain">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
