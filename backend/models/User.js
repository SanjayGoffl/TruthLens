const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const USER_ROLES = ['USER', 'ADMIN'];
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, default: null },
  profileImage: { type: String, default: null },
  role: { type: String, enum: USER_ROLES, default: 'USER' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: true },
  emailPreferences: {
    productUpdates: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true }
  },
  notificationPreferences: {
    analysis: { type: Boolean, default: true },
    results: { type: Boolean, default: true },
    verification: { type: Boolean, default: true },
    security: { type: Boolean, default: true },
    moderation: { type: Boolean, default: true },
    system: { type: Boolean, default: true }
  },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, { timestamps: true });
userSchema.methods.comparePassword = async function comparePassword(plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.methods.isLocked = function isLocked() {
  return !!this.lockUntil && this.lockUntil.getTime() > Date.now();
};
userSchema.methods.registerFailedAttempt = async function registerFailedAttempt() {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 6) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    this.loginAttempts = 0;
  }
  await this.save();
};
userSchema.methods.clearFailedAttempts = async function clearFailedAttempts() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profileImage: this.profileImage,
    role: this.role,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    twoFactorEnabled: this.twoFactorEnabled,
    emailPreferences: this.emailPreferences,
    notificationPreferences: this.notificationPreferences || { analysis: true, results: true, verification: true, security: true, moderation: true, system: true },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};
module.exports = mongoose.model('User', userSchema);
