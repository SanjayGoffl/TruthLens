// Vercel serverless entrypoint — thin shim that delegates to the backend.
// This file lives at the monorepo root so Vercel can discover it
// while the real logic stays in backend/.
const handler = require('../backend/api/index');
module.exports = handler;
