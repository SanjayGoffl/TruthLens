import axios from 'axios';
const TOKEN_KEY = 'newsguard_token';
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('newsguard_booted');
}
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}
const api = axios.create({ baseURL: '/api', timeout: 180000 });
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response && error.response.status;
    const isAuthCall = error.config && error.config.url && error.config.url.startsWith('/auth/');
    if ((status === 401 || status === 403) && !isAuthCall && getToken() && unauthorizedHandler) {
      unauthorizedHandler(status);
    }
    return Promise.reject(error);
  }
);
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err && err.response && err.response.data;
  if (data && data.message) return data.message;
  if (err && err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (err && err.message === 'Network Error') return 'Cannot reach the server. Please check your connection.';
  return fallback;
}
export default api;
