const bcrypt = require('bcryptjs');
const User = require('../models/User');
const env = require('../config/env');
const { isEmail } = require('../utils/validate');
const BLOCKED_PASSWORDS = new Set([
  'admin@1234',
  'admin123',
  'admin1234',
  'admin',
  'password',
  'password123',
  'changeme',
  'change_me',
  'change_me_admin_password',
  'replace_with_a_strong_unique_password',
  '12345678',
  '123456789',
  'newsguard'
]);
const EXAMPLE_PLACEHOLDER = /^(change_me|replace_with_|your_|example_)/i;
async function ensureAdmin() {
  const existing = await User.findOne({ role: 'ADMIN' });
  if (existing) return existing;
  const email = String(env.adminEmail || '').trim().toLowerCase();
  const password = env.adminPassword || '';
  if (!isEmail(email) || !password) {
    throw new Error(
      'Secure admin initialization required: no administrator exists yet, and ADMIN_EMAIL/ADMIN_PASSWORD are not set in backend/.env. ' +
        'Set both to explicit values (the app never creates a default admin account).'
    );
  }
  const passwordCheck = password.toLowerCase();
  if (password.length < 6 || BLOCKED_PASSWORDS.has(passwordCheck) || EXAMPLE_PLACEHOLDER.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD in backend/.env is a known default, a placeholder, or shorter than 6 characters. ' +
        'Choose a strong, unique password — the app refuses to initialize the admin account with an insecure value.'
    );
  }
  const byEmail = await User.findOne({ email });
  if (byEmail) {
    if (byEmail.role !== 'ADMIN') byEmail.role = 'ADMIN';
    byEmail.isActive = true;
    byEmail.isEmailVerified = true;
    await byEmail.save();
    return byEmail;
  }
  const hash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name: env.adminName || 'Administrator',
    email,
    passwordHash: hash,
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
    twoFactorEnabled: true
  });
  console.log('Admin account initialized from explicit environment configuration.');
  return admin;
}
module.exports = { ensureAdmin };
