const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many authentication attempts. Please wait a few minutes and try again.' }
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' }
});
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
  message: { success: false, code: 'RATE_LIMITED', message: 'Analysis limit reached. Please wait a minute before submitting another article.' }
});
module.exports = { authLimiter, apiLimiter, analysisLimiter };
