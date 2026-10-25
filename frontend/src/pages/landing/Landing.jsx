export default function Landing() {
  return (
    <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="card p-5 shadow-sm" style={{ maxWidth: 540, width: '100%', borderRadius: 20 }}>
        <h1 className="h3 fw-bold mb-3 text-center">TruthLens AI</h1>
        
        <div className="mb-4 text-center">
          <a 
            href="https://newsguard-web-sanjays-projects-3e4e4ed2.vercel.app" 
            target="_blank" 
            rel="noreferrer"
            className="text-primary fw-semibold fs-5 text-decoration-none"
          >
            newsguardai.vercel.app
          </a>
        </div>

        <div className="p-4 rounded-3 bg-soft mb-4" style={{ border: '1px solid var(--border)' }}>
          <div className="fw-bold mb-2" style={{ fontSize: 13.5 }}>Google OAuth Redirect URI</div>
          <div className="p-2.5 rounded bg-card font-mono text-xs text-break mb-3" style={{ border: '1px solid var(--border)' }}>
            https://newsguard-api-sanjays-projects-3e4e4ed2.vercel.app/api/auth/google/callback
          </div>
          <div className="text-muted-2 text-small">
            Add this URI in Google Cloud Console under your OAuth 2.0 Client credentials.
          </div>
        </div>

        <div className="text-center">
          <a href="/user/dashboard" className="btn btn-primary px-4">Open Dashboard</a>
        </div>
      </div>
    </div>
  );
}
