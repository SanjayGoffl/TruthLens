import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { setToken } from '../../services/api';
import { decodeJwtRole } from '../../utils/credibility';
export default function GoogleSuccessPage() {
  const [status, setStatus] = useState('working');
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const error = params.get('error');
    if (error) {
      setStatus({ kind: 'error', message: error });
      return;
    }
    if (!token) {
      setStatus({ kind: 'error', message: 'Google sign-in did not return a session. Please try again.' });
      return;
    }
    setToken(token);
    const role = decodeJwtRole(token);
    window.location.href = role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard';
  }, []);
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg)' }}>
      <div className="card text-center p-4 p-md-5" style={{ maxWidth: 430 }}>
        {status === 'working' ? (
          <>
            <Loader2 size={38} className="mx-auto mb-3 text-success" style={{ animation: 'spin 1s linear infinite' }} />
            <h5>Completing Google sign-in</h5>
            <p className="text-muted-2 mb-0" style={{ fontSize: 14 }}>Establishing your secure session…</p>
          </>
        ) : (
          <>
            <AlertTriangle size={38} className="mx-auto mb-3" style={{ color: 'var(--warning)' }} />
            <h5>Sign-in could not be completed</h5>
            <p className="text-muted-2" style={{ fontSize: 14 }}>{status.message}</p>
            <Link to="/login" className="btn btn-primary">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
