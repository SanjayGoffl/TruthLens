import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api, { clearToken, errorMessage, getToken, setToken, setUnauthorizedHandler } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);
  const performLogout = useCallback(async (reason) => {
    clearToken();
    setUser(null);
    disconnectSocket();
    try {
      await api.post('/auth/logout').catch(() => {});
    } catch (err) {
      return;
    }
    if (reason) toast.error(reason);
  }, []);
  logoutRef.current = performLogout;
  useEffect(() => {
    setUnauthorizedHandler((status) => {
      const reason = status === 403 ? 'You do not have permission to access this resource. Your session was closed for security.' : 'Your session has expired. Please sign in again.';
      if (logoutRef.current) logoutRef.current(reason);
      window.location.href = '/login';
    });
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/user/profile');
        if (!cancelled) {
          setUser(res.data.user);
          setStats(res.data.stats);
          connectSocket(getToken());
        }
      } catch (err) {
        if (!cancelled) {
          clearToken();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);
  const [stats, setStats] = useState(null);
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      setStats(null);
      connectSocket(res.data.token);
    }
    return res.data;
  }, []);
  const verifyOtp = useCallback(async (email, otp, purpose) => {
    const res = await api.post('/auth/verify-otp', { email, otp, purpose });
    if (res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      setStats(null);
      connectSocket(res.data.token);
    }
    return res.data;
  }, []);
  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.get('/user/profile');
      setUser(res.data.user);
      setStats(res.data.stats);
      return res.data;
    } catch (err) {
      return null;
    }
  }, []);
  const updateLocalUser = useCallback((next) => {
    setUser(next);
  }, []);
  const logout = useCallback(async () => {
    await performLogout();
    window.location.href = '/login';
  }, [performLogout]);
  const value = useMemo(
    () => ({ user, stats, loading, isAuthenticated: Boolean(user), login, verifyOtp, logout, refreshProfile, updateLocalUser, setStats }),
    [user, stats, loading, login, verifyOtp, logout, refreshProfile, updateLocalUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
export { errorMessage };
