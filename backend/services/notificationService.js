const Notification = require('../models/Notification');
const User = require('../models/User');
const socket = require('../utils/socket');
const DEFAULT_PREFS = { analysis: true, results: true, verification: true, security: true, moderation: true, system: true };
const EVENT_CATEGORY = {
  'article-received': 'analysis',
  'content-submitted': 'analysis',
  'analysis-started': 'analysis',
  'analysis-completed': 'analysis',
  'analysis-failed': 'analysis',
  'score-generated': 'results',
  'report-generated': 'results',
  'pdf-generated': 'results',
  'report-download-ready': 'results',
  'analysis-saved': 'results',
  'analysis-unsaved': 'results',
  'analysis-deleted': 'results',
  'suspicious-content': 'results',
  'misleading-content': 'results',
  'high-risk-article': 'results',
  'claim-verified': 'verification',
  'unsupported-claim': 'verification',
  'contradictory-claim': 'verification',
  'source-verified': 'verification',
  'low-reliability-source': 'verification',
  'account-welcome': 'security',
  'new-login': 'security',
  'password-changed': 'security',
  'password-reset': 'security',
  'two-factor-changed': 'security',
  'profile-updated': 'security',
  'account-status': 'security',
  'admin-user-registered': 'moderation',
  'admin-analysis-new': 'moderation',
  'admin-suspicious-flagged': 'moderation',
  'admin-high-risk-source': 'moderation',
  'admin-user-status': 'moderation',
  'admin-system-error': 'system',
  'system-maintenance': 'system'
};
const ALWAYS_ON_USER = new Set(['security']);
const ALWAYS_ON_ADMIN = new Set(['security', 'moderation']);
function categoryFor(code) {
  return EVENT_CATEGORY[code] || null;
}
function prefsOrDefault(userPrefs) {
  return { ...DEFAULT_PREFS, ...(userPrefs || {}) };
}
async function createForUser(userId, payload) {
  if (!userId) return null;
  const notification = await Notification.create({ audience: 'user', user: userId, ...payload });
  return notification;
}
async function createForAdmins(payload) {
  const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id').lean();
  const created = [];
  for (const admin of admins) {
    const notification = await Notification.create({ audience: 'admin', user: admin._id, ...payload });
    created.push(notification);
  }
  return created;
}
function payloadOf(event) {
  return {
    code: event.code,
    title: event.title,
    message: event.message || '',
    level: event.level || 'info',
    type: event.type || 'system',
    link: event.link || null,
    persist: Boolean(event.persist)
  };
}
async function pushUser(userId, event) {
  if (!userId) return null;
  const category = categoryFor(event.code);
  if (category && !ALWAYS_ON_USER.has(category)) {
    const doc = await User.findById(userId).select('notificationPreferences').lean();
    const prefs = prefsOrDefault(doc && doc.notificationPreferences);
    if (prefs[category] === false) return null;
  }
  const payload = payloadOf(event);
  socket.emitToUser(userId, 'notify', payload);
  if (event.persist) await createForUser(userId, payload);
  return payload;
}
async function pushAdmins(event) {
  const category = categoryFor(event.code);
  const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id notificationPreferences').lean();
  const payload = payloadOf(event);
  let delivered = false;
  for (const admin of admins) {
    if (category && !ALWAYS_ON_ADMIN.has(category)) {
      const prefs = prefsOrDefault(admin.notificationPreferences);
      if (prefs[category] === false) continue;
    }
    socket.emitToUser(admin._id, 'notify', payload);
    delivered = true;
    if (event.persist) await Notification.create({ audience: 'admin', user: admin._id, ...payload });
  }
  return delivered;
}
async function listForUser(userId, { page = 1, limit = 20 }) {
  const [total, unread, items] = await Promise.all([
    Notification.countDocuments({ user: userId, audience: 'user' }),
    Notification.countDocuments({ user: userId, audience: 'user', read: false }),
    Notification.find({ user: userId, audience: 'user' }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
  ]);
  return { total, unread, page, limit, items };
}
async function listForAdmin(adminId, { page = 1, limit = 20 }) {
  const [total, unread, items] = await Promise.all([
    Notification.countDocuments({ $or: [{ audience: 'admin' }, { user: adminId, audience: 'user' }] }),
    Notification.countDocuments({ $and: [{ read: false }, { $or: [{ audience: 'admin' }, { user: adminId, audience: 'user' }] }] }),
    Notification.find({ $or: [{ audience: 'admin' }, { user: adminId, audience: 'user' }] }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
  ]);
  return { total, unread, page, limit, items };
}
async function markRead(userId, notificationId, isAdmin) {
  const query = isAdmin ? { $or: [{ audience: 'admin' }, { user: userId }] } : { user: userId, audience: 'user' };
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, ...query },
    { read: true, readAt: new Date() },
    { new: true }
  );
  return notification;
}
async function markAllRead(userId, isAdmin) {
  const query = isAdmin ? { $or: [{ audience: 'admin' }, { user: userId }] } : { user: userId, audience: 'user' };
  await Notification.updateMany({ ...query, read: false }, { read: true, readAt: new Date() });
  return true;
}
module.exports = { createForUser, createForAdmins, pushUser, pushAdmins, listForUser, listForAdmin, markRead, markAllRead };
