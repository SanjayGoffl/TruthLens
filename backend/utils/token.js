const jwt = require('jsonwebtoken');
const env = require('../config/env');
function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer: 'newsguard-ai'
  });
}
function signResetToken(user, otpId) {
  return jwt.sign({ sub: user._id.toString(), purpose: 'reset', otpId }, env.jwtSecret, {
    expiresIn: '15m',
    issuer: 'newsguard-ai'
  });
}
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { issuer: 'newsguard-ai' });
}
module.exports = { signAccessToken, signResetToken, verifyToken };
