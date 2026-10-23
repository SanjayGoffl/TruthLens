import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function NotFoundPage() {
  const { user } = useAuth();
  const home = user ? (user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard') : '/';
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--bg)' }}>
      <div className="card text-center p-4 p-md-5" style={{ maxWidth: 440, borderTop: '4px solid var(--primary)' }}>
        <span className="empty-icon mx-auto"><FileQuestion size={30} /></span>
        <h1 className="mt-2 mb-1">Page not found</h1>
        <p className="text-muted-2" style={{ fontSize: 14 }}>
          The page you are looking for does not exist, was moved, or you may not have access to it.
        </p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Link to={home} className="btn btn-primary">{user ? 'My dashboard' : 'Back to home'}</Link>
          {user ? (
            <Link to="/" className="btn btn-ghost">Public site</Link>
          ) : (
            <Link to="/login" className="btn btn-ghost">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
