import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
export function goSection(id) {
  if (window.location.pathname === '/') {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  window.location.href = `/#${id}`;
}
export function useSectionScroll() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return undefined;
    const id = location.hash.slice(1);
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        navigate(location.pathname, { replace: true });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [location, navigate]);
}
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
