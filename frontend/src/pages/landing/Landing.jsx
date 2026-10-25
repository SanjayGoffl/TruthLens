export default function Landing() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="card p-5 shadow-sm" style={{ maxWidth: 580, width: '100%', borderRadius: 20 }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="avatar avatar-md" style={{ background: 'var(--primary)', color: '#fff', fontSize: 20 }}>TL</div>
          <div>
            <h1 className="h3 fw-bold mb-0">TruthLens AI</h1>
            <p className="text-muted-2 text-small mb-0">Autonomous Credibility & Fact Verification</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-small fw-semibold text-muted mb-2 text-uppercase" style={{ letterSpacing: '0.06em' }}>Production Deploy</div>
          <a 
            href="https://newsguard-web-sanjays-projects-3e4e4ed2.vercel.app" 
            target="_blank" 
            rel="noreferrer"
            className="d-block p-3 rounded-3 bg-soft text-primary fw-semibold text-truncate"
            style={{ border: '1px solid var(--border)' }}
          >
            https://newsguard-web-sanjays-projects-3e4e4ed2.vercel.app
          </a>
        </div>

        <div className="p-4 rounded-3 bg-soft" style={{ border: '1px solid var(--border)' }}>
          <h2 className="h6 fw-bold mb-2">Google OAuth Setup Step</h2>
          <p className="text-muted-2 text-small mb-3">
            To enable Google Sign-In, add this exact redirect URI in your Google Cloud Console project:
          </p>
          <div className="p-2.5 rounded bg-card font-mono text-xs text-break mb-3" style={{ border: '1px solid var(--border)' }}>
            https://newsguard-api-sanjays-projects-3e4e4ed2.vercel.app/api/auth/google/callback
          </div>
          <ol className="text-muted-2 text-small ps-3 mb-0" style={{ lineHeight: 1.6 }}>
            <li>Go to Google Cloud Console → APIs & Services → Credentials.</li>
            <li>Select your OAuth 2.0 Client ID.</li>
            <li>Under <strong>Authorized redirect URIs</strong>, click <em>Add URI</em> and paste the link above.</li>
            <li>Save changes.</li>
          </ol>
        </div>

        <div className="mt-4 text-center">
          <a href="/user/dashboard" className="btn btn-primary w-100">Enter Dashboard</a>
        </div>
      </div>
    </div>
  );
}
