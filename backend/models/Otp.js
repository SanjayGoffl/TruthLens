const mongoose = require('mongoose');
const OTP_PURPOSES = ['login', 'reset'];
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  purpose: { type: String, enum: OTP_PURPOSES, required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  resendCount: { type: Number, default: 0 },
  lastResentAt: { type: Date, default: null }
}, { timestamps: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1, usedAt: 1 });
module.exports = mongoose.model('Otp', otpSchema);
