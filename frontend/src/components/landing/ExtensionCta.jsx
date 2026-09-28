import { Chrome, ClipboardPaste, MousePointerClick } from 'lucide-react';

export default function ExtensionCta() {
  return (
    <section className="py-5" aria-labelledby="ext-title">
      <div className="container">
        <div className="ext-card">
          <div className="row align-items-center g-4 position-relative" style={{ zIndex: 1 }}>
            <div className="col-lg-7">
              <span className="chip chip-teal pill mb-3"><Chrome size={13} /> Browser extension</span>
              <h2 id="ext-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Check any article without leaving the page</h2>
              <p style={{ color: '#C7D2FE', maxWidth: 520 }} className="mb-0">
                Right-click a page, link or selected paragraph and send it straight to TruthLens AI. You review it in the analyzer and get the full report in seconds.
              </p>
            </div>
            <div className="col-lg-5">
              <ul className="list-unstyled d-grid gap-3 mb-0">
                <li className="d-flex gap-3 align-items-center"><MousePointerClick size={20} /> One-click page and link checks</li>
                <li className="d-flex gap-3 align-items-center"><ClipboardPaste size={20} /> Selected text works on paywalled pages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
