const mongoose = require('mongoose');
const NOTIFICATION_TYPES = ['analysis', 'report', 'security', 'system', 'flagged', 'user', 'alert'];
const AUDIENCES = ['user', 'admin'];
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  audience: { type: String, enum: AUDIENCES, default: 'user' },
  type: { type: String, enum: NOTIFICATION_TYPES, default: 'system' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: null },
  read: { type: Boolean, default: false },
  readAt: { type: Date, default: null }
}, { timestamps: true });
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
