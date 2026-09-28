import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function DashboardGuard({ role, children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const cancelled = useRef(false);
  useEffect(() => {
    cancelled.current = false;
    if (loading || !user || user.role === role) return undefined;
    const timer = setTimeout(() => {
      if (!cancelled.current) logout();
    }, 500);
    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [user, role, loading, logout]);
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-3" role="status" />
          <div className="text-muted-2">Securing your session…</div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg)' }}>
        <div className="card text-center p-4" style={{ maxWidth: 440 }}>
          <div className="empty-icon mx-auto mb-3" style={{ color: 'var(--danger)', background: 'rgba(220,38,38,.12)' }}>
            <ShieldAlert size={30} />
          </div>
          <h5>Unauthorized route detected</h5>
          <p style={{ fontSize: 14 }}>This area belongs to a different account role. Your session is being signed out and cleared for security.</p>
          <div className="d-flex justify-content-center gap-2 mt-2">
            <span className="spinner-border spinner-border-sm text-danger" role="status" />
            <span className="text-danger fw-semibold" style={{ fontSize: 13 }}>Invalidating session…</span>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
