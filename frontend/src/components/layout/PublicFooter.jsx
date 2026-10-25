import { Link } from 'react-router-dom';
import { FileText, Gauge, Scale, ShieldCheck } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
export default function PublicFooter() {
  const { isAuthenticated } = useAuth();
  const appPath = (path) => (isAuthenticated ? path : `/login?next=${encodeURIComponent(path)}`);
  return (
    <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
      <div className="py-5 px-3 px-lg-4" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="row g-4">
          <div className="col-lg-5">
            <Logo size={34} />
            <p className="text-secondary-2 mt-3 mb-3" style={{ fontSize: 14, maxWidth: 380 }}>
              AI-powered news credibility analysis. Submit a URL or paste an article to understand the source, claims, evidence and writing behind the story — with a transparent, explainable score.
            </p>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Link to="/register" className="btn btn-primary btn-sm">Start Analyzing</Link>
              <span className="chip chip-green pill"><ShieldCheck size={13} /> Transparency First</span>
            </div>
          </div>
          <div className="col-6 col-md-3 col-lg-2">
            <h2 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Explore</h2>
            <ul className="list-unstyled d-grid gap-2" style={{ fontSize: 14 }}>
              <li><Link to="/#how-it-works" className="link-plain">How It Works</Link></li>
              <li><Link to="/#features" className="link-plain">Features</Link></li>
              <li><Link to="/#credibility" className="link-plain">Credibility Levels</Link></li>
              <li><Link to="/#about" className="link-plain">About</Link></li>
              <li><Link to="/#faq" className="link-plain">FAQ</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-3 col-lg-2">
            <h2 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Product</h2>
            <ul className="list-unstyled d-grid gap-2" style={{ fontSize: 14 }}>
              <li><Link to={appPath('/user/analyze')} className="link-plain">Analyze an Article</Link></li>
              <li><Link to={appPath('/user/sources')} className="link-plain">Source Explorer</Link></li>
              <li><Link to="/login" className="link-plain">Sign In</Link></li>
              <li><Link to="/register" className="link-plain">Sign Up</Link></li>
            </ul>
          </div>
          <div className="col-12 col-md-3 col-lg-3">
            <h2 className="mb-3" style={{ fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>How Analysis Works</h2>
            <ul className="list-unstyled d-grid gap-2 text-secondary-2" style={{ fontSize: 13.5 }}>
              <li className="d-flex gap-2 align-items-start"><Gauge size={15} className="flex-shrink-0 mt-1 text-success" /> Weighted credibility score with a full factor breakdown</li>
              <li className="d-flex gap-2 align-items-start"><Scale size={15} className="flex-shrink-0 mt-1 text-success" /> Claim-level assessment, never a blanket true/false verdict</li>
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
