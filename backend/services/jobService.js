const crypto = require('crypto');
const cache = require('./cacheService');

const TTL = 3600;
const key = (id) => `job:${id}`;

// Job state lives in the cache (Redis when available, memory otherwise) so it can be polled
// after a page refresh. The work itself runs in-process, outside the HTTP request.
async function create(userId, kind) {
  const id = crypto.randomBytes(12).toString('hex');
  const job = { id, userId: String(userId), kind, status: 'queued', stage: 0, message: 'Queued', createdAt: Date.now() };
  await cache.set(key(id), job, TTL);
  return job;
}

async function update(id, patch) {
  const job = await cache.get(key(id));
  if (!job) return null;
  const next = { ...job, ...patch, updatedAt: Date.now() };
  await cache.set(key(id), next, TTL);
  return next;
}

async function get(id) {
  return cache.get(key(id));
}

module.exports = { create, update, get };
