// Vercel serverless entrypoint for the TruthLens AI API.
// The long-lived Express server (server.js) stays for local/Docker runs;
// on Vercel each cold start boots one shared instance lazily and reuses it.
const mongoose = require('mongoose');

let bootPromise = null;

async function boot() {
  if (mongoose.connection.readyState === 1) return;
  require('../services/cacheService').initRedis();
  await require('../config/db').connectDB();
  try {
    const admin = await require('../services/adminInitService').ensureAdmin();
    if (admin) console.log('Administrator account ready');
  } catch (err) {
    console.error('ensureAdmin failed:', err.message);
  }
}

function ensureBoot() {
  if (!bootPromise) {
    bootPromise = boot().catch((err) => {
      bootPromise = null;
      throw err;
    });
  }
  return bootPromise;
}

const app = require('../app');

module.exports = async (req, res) => {
  try {
    await ensureBoot();
  } catch (err) {
    console.error('Boot failed:', err.message);
  }
  return app(req, res);
};
