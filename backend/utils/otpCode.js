const crypto = require('crypto');
const env = require('../config/env');
function makeCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}
function hashCode(code, email, purpose) {
  return crypto.createHash('sha256').update(`${purpose}:${email.toLowerCase()}:${code}`).digest('hex');
}
function safeCompare(input, hash, email, purpose) {
  const candidate = hashCode(String(input).trim(), email, purpose);
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function expiryDate() {
  return new Date(Date.now() + env.otpTtlMinutes * 60 * 1000);
}
module.exports = { makeCode, hashCode, safeCompare, expiryDate };
