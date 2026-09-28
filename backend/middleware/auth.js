const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const env = require('../config/env');
async function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    let payload;
    try {
      payload = jwt.verify(header.slice(7), env.jwtSecret, { issuer: 'newsguard-ai' });
    } catch (err) {
      return next(new AppError('Session expired or invalid. Please sign in again.', 401, 'TOKEN_INVALID'));
    }
    if (!payload || !payload.sub || payload.purpose) {
      return next(new AppError('Session expired or invalid. Please sign in again.', 401, 'TOKEN_INVALID'));
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new AppError('Account no longer exists. Please register again.', 401, 'USER_NOT_FOUND'));
    }
    if (!user.isActive) {
      return next(new AppError('This account has been deactivated. Contact support for assistance.', 403, 'ACCOUNT_DISABLED'));
    }
    req.user = user;
    req.tokenRole = user.role;
    return next();
  } catch (err) {
    return next(err);
  }
}
function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }
    return next();
  };
}
const requireAdmin = requireRole('ADMIN');
module.exports = { authenticateToken, requireRole, requireAdmin };
