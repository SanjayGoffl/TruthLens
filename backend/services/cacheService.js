const crypto = require('crypto');
const env = require('../config/env');

const memory = new Map();
const MEMORY_MAX = 500;
let redis = null;
let redisReady = false;

function initRedis() {
  if (!env.redisUrl || redis) return;
  try {
    const Redis = require('ioredis');
    redis = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 5 ? null : Math.min(times * 500, 3000))
    });
    redis.on('ready', () => {
      redisReady = true;
      console.log('Redis cache connected');
    });
    redis.on('end', () => {
      redisReady = false;
    });
    redis.on('error', () => {
      redisReady = false;
    });
    redis.connect().catch(() => {
      console.warn('Redis unavailable — using in-memory cache fallback');
    });
  } catch (err) {
    redis = null;
    console.warn('Redis client could not start — using in-memory cache fallback:', err.message);
  }
}

function memGet(key) {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.exp < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

function memSet(key, value, ttlSeconds) {
  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value);
  memory.set(key, { value, exp: Date.now() + ttlSeconds * 1000 });
}

async function get(key) {
  if (redisReady) {
    try {
      const raw = await redis.get(`ng:${key}`);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      /* fall through to memory */
    }
  }
  return memGet(key);
}

async function set(key, value, ttlSeconds = 300) {
  memSet(key, value, ttlSeconds);
  if (redisReady) {
    try {
      await redis.set(`ng:${key}`, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      /* memory copy already stored */
    }
  }
}

async function del(key) {
  memory.delete(key);
  if (redisReady) {
    try {
      await redis.del(`ng:${key}`);
    } catch (err) {
      /* ignore */
    }
  }
}

async function remember(key, ttlSeconds, producer) {
  const cached = await get(key);
  if (cached !== null && cached !== undefined) return { value: cached, hit: true };
  const value = await producer();
  if (value !== null && value !== undefined) await set(key, value, ttlSeconds);
  return { value, hit: false };
}

function hash(...parts) {
  return crypto.createHash('sha256').update(parts.map((p) => String(p || '')).join('\u0001')).digest('hex').slice(0, 40);
}

function status() {
  return { backend: redisReady ? 'redis' : 'memory', entries: memory.size };
}

module.exports = { initRedis, get, set, del, remember, hash, status };
