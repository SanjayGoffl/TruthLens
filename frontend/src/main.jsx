import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MotionConfig } from 'framer-motion';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './premium.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'toast-inline',
                style: { maxWidth: 420 },
                success: { iconTheme: { primary: '#6366F1', secondary: '#ffffff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#ffffff' }, duration: 5200 }
              }}
            />
            <App />
          </AuthProvider>
        </ThemeProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
