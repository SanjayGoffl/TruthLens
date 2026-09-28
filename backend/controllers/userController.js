const User = require('../models/User');
const Analysis = require('../models/Analysis');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const bcrypt = require('bcryptjs');
const notificationService = require('../services/notificationService');
const notificationModel = require('../models/Notification');
const axios = require('axios');
const env = require('../config/env');
let serviceStatusCache = null;
let serviceStatusCheckedAt = 0;
async function checkExternalServices() {
  const now = Date.now();
  if (serviceStatusCache && now - serviceStatusCheckedAt < 60000) return serviceStatusCache;
  const gemini = env.geminiApiKey
    ? axios.get('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash', { params: { key: env.geminiApiKey }, timeout: 5000 }).then(() => 'live').catch(() => 'unavailable')
    : Promise.resolve('unavailable');
  const serper = env.serperApiKey
    ? axios.post('https://google.serper.dev/search', { q: 'TruthLens AI', num: 1, gl: 'in' }, { headers: { 'X-API-KEY': env.serperApiKey, 'Content-Type': 'application/json' }, timeout: 5000 }).then(() => 'live').catch(() => 'unavailable')
    : Promise.resolve('unavailable');
  const [geminiStatus, serperStatus] = await Promise.all([gemini, serper]);
  serviceStatusCache = { gemini: geminiStatus, serper: serperStatus };
  serviceStatusCheckedAt = now;
  return serviceStatusCache;
}
exports.getServiceStatus = asyncHandler(async (req, res) => {
  return res.json({ success: true, services: await checkExternalServices() });
});
exports.getProfile = asyncHandler(async (req, res) => {
  const [counts, avg] = await Promise.all([
    Analysis.aggregate([{ $match: { user: req.user._id, analysisStatus: { $in: ['completed', 'heuristic'] } } }, { $group: { _id: null, total: { $sum: 1 }, avg: { $avg: '$overallScore' }, saved: { $sum: { $cond: ['$isSaved', 1, 0] } } } }]),
    Analysis.countDocuments({ user: req.user._id, analysisStatus: { $in: ['completed', 'heuristic'] }, overallScore: { $gte: 80 } })
  ]);
  const stats = counts[0] || { total: 0, avg: 0, saved: 0 };
  const unreadFilter = req.user.role === 'ADMIN' ? { user: req.user._id, read: false, $or: [{ audience: 'admin' }, { audience: 'user' }] } : { user: req.user._id, read: false, audience: 'user' };
  const unread = await notificationModel.countDocuments(unreadFilter);
  return res.json({
    success: true,
    user: req.user.toSafeJSON(),
    stats: {
      totalAnalyses: stats.total,
      savedReports: stats.saved,
      averageScore: Math.round(stats.avg || 0),
      highlyCredible: avg,
      unreadNotifications: unread
    }
  });
});
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, profileImage } = req.body || {};
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2 || trimmed.length > 80) throw new AppError('Name must be between 2 and 80 characters.', 400, 'VALIDATION_ERROR');
    req.user.name = trimmed;
  }
  if (profileImage !== undefined) {
    if (profileImage === null) {
      req.user.profileImage = null;
    } else if (typeof profileImage === 'string' && profileImage.startsWith('data:image/')) {
      req.user.profileImage = profileImage.slice(0, 400000);
    } else {
      throw new AppError('Profile image must be a valid image data URL.', 400, 'VALIDATION_ERROR');
    }
  }
  await req.user.save();
  await notificationService.pushUser(req.user._id, { code: 'profile-updated', type: 'user', title: 'Profile updated', message: 'Your profile details were updated successfully.', level: 'info', link: '/user/profile', persist: true });
  return res.json({ success: true, user: req.user.toSafeJSON(), message: 'Profile updated.' });
});
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword) throw new AppError('Enter your current password.', 400, 'VALIDATION_ERROR');
  if (!req.user.passwordHash) throw new AppError('This account uses Google sign-in and has no password set.', 400, 'GOOGLE_ACCOUNT');
  const valid = await req.user.comparePassword(String(currentPassword));
  if (!valid) throw new AppError('Current password is incorrect.', 400, 'INVALID_CREDENTIALS');
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(newPassword || ''))) {
    throw new AppError('New password must be at least 8 characters with upper and lower case letters, a number and a special character.', 400, 'WEAK_PASSWORD');
  }
  if (newPassword !== confirmPassword) throw new AppError('Passwords do not match.', 400, 'VALIDATION_ERROR');
  const same = await req.user.comparePassword(String(newPassword));
  if (same) throw new AppError('New password must be different from the current password.', 400, 'VALIDATION_ERROR');
  req.user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  req.user.loginAttempts = 0;
  req.user.lockUntil = null;
  await req.user.save();
  await notificationService.pushUser(req.user._id, { code: 'password-changed', type: 'security', title: 'Password changed', message: 'Your password was changed successfully. If this was not you, contact support immediately.', level: 'warning', link: '/user/profile', persist: true });
  return res.json({ success: true, message: 'Password changed successfully.' });
});
exports.updatePreferences = asyncHandler(async (req, res) => {
  const { twoFactorEnabled, emailPreferences, notificationPreferences } = req.body || {};
  if (typeof twoFactorEnabled === 'boolean') {
    if (twoFactorEnabled === false) {
      const { currentPassword } = req.body || {};
      if (!currentPassword || !req.user.passwordHash || !(await req.user.comparePassword(String(currentPassword)))) {
        throw new AppError('Enter your current password to turn off the email security code.', 400, 'INVALID_CREDENTIALS');
      }
    }
    req.user.twoFactorEnabled = twoFactorEnabled;
    await notificationService.pushUser(req.user._id, { code: 'two-factor-changed', type: 'security', title: twoFactorEnabled ? '2FA enabled' : '2FA disabled', message: twoFactorEnabled ? 'The email security code is now required at every manual sign-in.' : 'The email security code will no longer be required at sign-in.', level: 'warning', link: '/user/settings', persist: true });
  }
  if (emailPreferences && typeof emailPreferences === 'object') {
    req.user.emailPreferences = {
      productUpdates: Boolean(emailPreferences.productUpdates),
      securityAlerts: Boolean(emailPreferences.securityAlerts)
    };
  }
  if (notificationPreferences && typeof notificationPreferences === 'object') {
    const current = req.user.notificationPreferences || {};
    const merged = { ...current };
    for (const key of ['analysis', 'results', 'verification', 'security', 'moderation', 'system']) {
      if (typeof notificationPreferences[key] === 'boolean') merged[key] = notificationPreferences[key];
    }
    req.user.notificationPreferences = merged;
  }
  await req.user.save();
  return res.json({ success: true, user: req.user.toSafeJSON(), message: 'Settings saved.' });
});
exports.getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const data = await notificationService.listForUser(req.user._id, { page, limit });
  return res.json({ success: true, ...data });
});
exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user._id, req.params.id, false);
  if (!notification) throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  return res.json({ success: true, message: 'Notification marked as read.' });
});
exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id, false);
  return res.json({ success: true, message: 'All notifications marked as read.' });
});
