const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const { authenticateToken } = require('./middleware/auth');
const { sanitizeInput } = require('./middleware/sanitize');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const app = express();
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: { directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'img-src': ["'self'", 'data:', 'blob:', 'https:'] } },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin: env.nodeEnv === 'production' ? [env.frontendUrl] : [env.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(sanitizeInput);
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'TruthLens AI API', cache: require('./services/cacheService').status().backend, time: new Date().toISOString() });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.get('/api/public/report/:token', require('./controllers/analysisController').getShared);
app.use('/api/user', authenticateToken, require('./routes/userRoutes'));
app.use('/api/analysis', authenticateToken, require('./routes/analysisRoutes'));
app.use('/api/sources', authenticateToken, require('./routes/sourceRoutes'));
app.use('/api/admin', authenticateToken, require('./middleware/auth').requireAdmin, require('./routes/adminRoutes'));
// Serve the built web app (PWA) from the API when frontend/dist exists: one URL for phone install.
const path = require('path');
const distDir = path.join(__dirname, '..', 'frontend', 'dist');
if (require('fs').existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir, { maxAge: '1h', setHeaders: (res, file) => { if (/sw.js$|index.html$|manifest/.test(file)) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}
app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
