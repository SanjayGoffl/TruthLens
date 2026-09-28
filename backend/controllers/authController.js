const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isEmail, hasStrongPassword } = require('../utils/validate');
const { signAccessToken, signResetToken, verifyToken } = require('../utils/token');
const otpService = require('../services/otpService');
const googleService = require('../services/googleService');
const notificationService = require('../services/notificationService');
const env = require('../config/env');
function publicUser(user) {
  return {
    token: signAccessToken(user),
    user: user.toSafeJSON()
  };
}
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, profileImage, acceptTerms } = req.body || {};
  if (!name || !String(name).trim() || String(name).trim().length < 2) {
    throw new AppError('Please enter your full name (at least 2 characters).', 400, 'VALIDATION_ERROR');
  }
  if (!isEmail(email || '')) {
    throw new AppError('Please enter a valid email address.', 400, 'VALIDATION_ERROR');
  }
  if (!hasStrongPassword(password || '')) {
    throw new AppError('Password must be at least 8 characters with upper and lower case letters, a number and a special character.', 400, 'WEAK_PASSWORD');
  }
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match.', 400, 'VALIDATION_ERROR');
  }
  if (!acceptTerms) {
    throw new AppError('You must accept the Terms & Conditions to register.', 400, 'TERMS_REQUIRED');
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists. Please sign in instead.', 409, 'EMAIL_EXISTS');
  }
  const hash = await bcrypt.hash(String(password), 12);
  let image = null;
  if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('data:image/')) {
    image = profileImage.slice(0, 400000);
  }
  const user = await User.create({
    name: String(name).trim().slice(0, 80),
    email: normalizedEmail,
    passwordHash: hash,
    profileImage: image,
    role: 'USER',
    isActive: true,
    isEmailVerified: false,
    twoFactorEnabled: true
  });
  await notificationService.pushUser(user._id, { code: 'account-welcome', type: 'security', title: 'Welcome to TruthLens AI', message: 'Your account was created successfully. Sign in with your email and the one-time code we send you.', level: 'success', link: '/login', persist: true });
  await notificationService.pushAdmins({ code: 'admin-user-registered', type: 'user', title: 'Admin: New user registered', message: `${String(name).slice(0, 60)} (${normalizedEmail}) created a new account.`, level: 'info', link: '/admin/users', persist: true });
  return res.status(201).json({ success: true, message: 'Account created. Please sign in to continue.' });
});
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email || '') || !password) {
    throw new AppError('Please enter a valid email and password.', 400, 'VALIDATION_ERROR');
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }
  if (user.isLocked()) {
    throw new AppError('Too many failed attempts. Try again in about 15 minutes.', 429, 'ACCOUNT_LOCKED');
  }
  const valid = await user.comparePassword(String(password));
  if (!valid) {
    await user.registerFailedAttempt();
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }
  await user.clearFailedAttempts();
  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Contact support for assistance.', 403, 'ACCOUNT_DISABLED');
  }
  if (user.twoFactorEnabled) {
    const { delivered } = await otpService.issueOtp(user.email, 'login');
    return res.json({
      success: true,
      otpRequired: true,
      delivered,
      expiresInMinutes: env.otpTtlMinutes,
      message: 'A one-time security code was sent to your email. Enter it to continue.'
    });
  }
  return res.json({ success: true, ...publicUser(user), message: 'Signed in successfully.' });
});
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {};
  if (!isEmail(email || '') || !otp) {
    throw new AppError('Email and code are required.', 400, 'VALIDATION_ERROR');
  }
  const purpose = req.body.purpose === 'reset' ? 'reset' : 'login';
  if (purpose === 'login') {
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) throw new AppError('Account not found for this email.', 404, 'USER_NOT_FOUND');
    if (!user.isActive) throw new AppError('This account has been deactivated.', 403, 'ACCOUNT_DISABLED');
    const { valid } = await otpService.verifyOtp(user.email, 'login', otp);
    if (!valid) throw new AppError('Invalid code.', 400, 'OTP_INVALID');
    user.isEmailVerified = true;
    await user.save();
    await notificationService.pushUser(user._id, { code: 'new-login', type: 'security', title: 'New login detected', message: `You signed in from ${req.ip || 'an unknown location'}. If this was not you, change your password immediately.`, level: 'info', link: '/user/profile', persist: true });
    return res.json({ success: true, ...publicUser(user), message: 'Identity verified. Welcome back.' });
  }
  const { otp: verified } = await otpService.verifyOtp(String(email).toLowerCase(), 'reset', otp);
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) throw new AppError('Account not found.', 404, 'USER_NOT_FOUND');
  const resetToken = signResetToken(user, verified._id);
  return res.json({ success: true, resetToken, message: 'Code verified. Choose a new password.' });
});
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const purpose = req.body.purpose === 'reset' ? 'reset' : 'login';
  if (!isEmail(email || '')) throw new AppError('A valid email is required.', 400, 'VALIDATION_ERROR');
  await otpService.canResend(String(email).toLowerCase(), purpose);
  const { delivered } = await otpService.issueOtp(String(email).toLowerCase(), purpose);
  const record = await Otp.findOne({ email: String(email).toLowerCase(), purpose, usedAt: null }).sort({ createdAt: -1 });
  if (record) {
    record.resendCount += 1;
    record.lastResentAt = new Date();
    await record.save();
  }
  return res.json({ success: true, delivered, message: 'A new code was sent to your email.' });
});
exports.googleUrl = asyncHandler(async (req, res) => {
  if (!googleService.isConfigured()) {
    throw new AppError('Google sign-in is not configured on this deployment. Please use email and password instead.', 503, 'GOOGLE_NOT_CONFIGURED');
  }
  return res.json({ success: true, url: googleService.getAuthUrl() });
});
async function resolveGoogleProfile(profile) {
  const { googleId, email, name, picture } = profile;
  let user = await User.findOne({ googleId }).select('+passwordHash');
  if (!user) {
    user = await User.findOne({ email }).select('+passwordHash');
    if (user) {
      user.googleId = googleId;
      user.isEmailVerified = true;
      if (picture && !user.profileImage) user.profileImage = picture;
      await user.save();
    }
  }
  if (!user) {
    const isAdmin = env.googleAdminEmail && String(env.googleAdminEmail).toLowerCase().split(',').includes(email.toLowerCase());
    user = await User.create({
      name,
      email,
      googleId,
      profileImage: picture || null,
      role: isAdmin ? 'ADMIN' : 'USER',
      isActive: true,
      isEmailVerified: true,
      twoFactorEnabled: false
    });
  }
  const adminList = String(env.googleAdminEmail || '')
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (adminList.includes(String(email).toLowerCase()) && user.role !== 'ADMIN') {
    user.role = 'ADMIN';
  }
  if (!user.isActive) throw new AppError('This account has been deactivated.', 403, 'ACCOUNT_DISABLED');
  user.isEmailVerified = true;
  await user.save();
  return user;
}
exports.googleExchange = asyncHandler(async (req, res) => {
  const { token } = req.body || {};
  if (!token) throw new AppError('Google token is required.', 400, 'VALIDATION_ERROR');
  if (!googleService.isConfigured()) {
    throw new AppError('Google sign-in is not configured on this deployment.', 503, 'GOOGLE_NOT_CONFIGURED');
  }
  let profile;
  try {
    profile = await googleService.verifyIdToken(String(token));
  } catch (err) {
    throw new AppError('Google could not verify your identity. Please try again.', 401, 'GOOGLE_VERIFY_FAILED');
  }
  const user = await resolveGoogleProfile(profile);
  await notificationService.pushUser(user._id, { code: 'new-login', type: 'security', title: 'New login detected', message: 'You signed in with Google. If this was not you, review your connected accounts immediately.', level: 'info', link: '/user/profile', persist: true });
  return res.json({ success: true, ...publicUser(user), message: 'Signed in with Google.' });
});
exports.googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query || {};
  const redirect = (hash) => res.redirect(`${env.frontendUrl}/auth/google-success#${hash}`);
  if (error || !code || !state) return redirect(`error=${encodeURIComponent('Google sign-in was cancelled or failed.')}`);
  if (!googleService.consumeState(state)) return redirect(`error=${encodeURIComponent('Sign-in request expired. Please try again.')}`);
  if (!googleService.isConfigured()) return redirect(`error=${encodeURIComponent('Google sign-in is not configured.')}`);
  let payload;
  try {
    payload = await googleService.exchangeCode(code);
  } catch (err) {
    return redirect(`error=${encodeURIComponent('Google could not verify your identity. Please try again.')}`);
  }
  try {
    const user = await resolveGoogleProfile(payload.profile);
    const token = signAccessToken(user);
    await notificationService.pushUser(user._id, { code: 'new-login', type: 'security', title: 'New login detected', message: 'You signed in with Google. If this was not you, review your connected accounts immediately.', level: 'info', link: '/user/profile', persist: true });
    return redirect(`token=${encodeURIComponent(token)}&name=${encodeURIComponent(user.name)}`);
  } catch (err) {
    return redirect(`error=${encodeURIComponent(err.message || 'Sign-in could not be completed.')}`);
  }
});
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!isEmail(email || '')) throw new AppError('Please enter a valid email address.', 400, 'VALIDATION_ERROR');
  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  if (!user) {
    return res.json({ success: true, message: 'If an account exists for this email, a reset code has been sent.' });
  }
  if (!user.passwordHash) {
    return res.json({ success: true, message: 'If an account exists for this email, a reset code has been sent.' });
  }
  const { delivered } = await otpService.issueOtp(normalizedEmail, 'reset');
  return res.json({ success: true, delivered, message: 'If an account exists for this email, a reset code has been sent.' });
});
exports.verifyResetOtp = exports.verifyOtp;
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body || {};
  if (!token || !hasStrongPassword(password || '')) {
    throw new AppError('Password must be at least 8 characters with upper and lower case letters, a number and a special character.', 400, 'WEAK_PASSWORD');
  }
  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match.', 400, 'VALIDATION_ERROR');
  }
  let payload;
  try {
    payload = verifyToken(String(token));
  } catch (err) {
    throw new AppError('This reset link has expired. Please request a new code.', 400, 'RESET_TOKEN_INVALID');
  }
  if (payload.purpose !== 'reset') throw new AppError('Invalid reset token.', 400, 'RESET_TOKEN_INVALID');
  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user) throw new AppError('Account not found.', 404, 'USER_NOT_FOUND');
  if (!user.passwordHash) throw new AppError('This account uses Google sign-in and has no password to reset.', 400, 'GOOGLE_ACCOUNT');
  user.passwordHash = await bcrypt.hash(String(password), 12);
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();
  await Otp.deleteMany({ email: user.email, purpose: 'reset' });
  await notificationService.pushUser(user._id, { code: 'password-reset', type: 'security', title: 'Password reset completed', message: 'Your password was reset. If you did not do this, contact support immediately.', level: 'warning', link: '/user/profile', persist: true });
  return res.json({ success: true, message: 'Password updated. Please sign in with your new password.' });
});
exports.logout = asyncHandler(async (req, res) => {
  return res.json({ success: true, message: 'Signed out.' });
});
