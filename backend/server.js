const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./utils/socket');
const { ensureAdmin } = require('./services/adminInitService');
async function start() {
  require('./services/cacheService').initRedis();
  await connectDB();
  const admin = await ensureAdmin();
  if (admin) console.log(`Administrator account ready: ${admin.email}`);
  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`TruthLens AI API listening on ${env.backendUrl}`);
    setTimeout(() => {
      const socket = require('./utils/socket');
      socket.emitToAdmins('notify', { code: 'system-maintenance', title: 'System service alert', message: 'TruthLens AI services are back online after a restart. All systems operational.', level: 'info', type: 'system', link: '/admin/dashboard', persist: false });
    }, 1500);
  });
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
start().catch((err) => {
  console.error('Failed to start server:', err.message || err);
  process.exit(1);
});
