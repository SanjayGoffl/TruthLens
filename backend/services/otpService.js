const Otp = require('../models/Otp');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { makeCode, hashCode, safeCompare, expiryDate } = require('../utils/otpCode');
const { sendOtpEmail } = require('./mailService');
const MAX_RESENDS = 3;
async function issueOtp(email, purpose) {
  await Otp.deleteMany({ email: email.toLowerCase(), purpose, usedAt: null });
  const code = makeCode();
  const otp = await Otp.create({
    email: email.toLowerCase(),
    purpose,
    codeHash: hashCode(code, email, purpose),
    expiresAt: expiryDate(),
    maxAttempts: env.otpMaxAttempts
  });
  let delivered = 'console';
  try {
    await sendOtpEmail(email, email, code, purpose);
    delivered = 'email';
  } catch (err) {
    if (env.nodeEnv !== 'development') throw err;
    delivered = 'console';
  }
  if (delivered === 'console' && env.nodeEnv === 'development') {
    console.log(`[DEV OTP] email=${email} purpose=${purpose} code=${code}`);
  }
  return { otp, delivered };
}
async function verifyOtp(email, purpose, code) {
  const active = await Otp.findOne({ email: email.toLowerCase(), purpose, usedAt: null }).sort({ createdAt: -1 });
  if (!active) {
    throw new AppError('No active verification code found for this email. Please request a new code.', 400, 'NO_OTP');
  }
  if (active.expiresAt.getTime() < Date.now()) {
    throw new AppError('This code has expired. Please request a new code.', 400, 'OTP_EXPIRED');
  }
  if (active.attempts >= active.maxAttempts) {
    throw new AppError('Too many incorrect attempts. Please request a new code.', 429, 'OTP_ATTEMPTS_EXCEEDED');
  }
  if (!safeCompare(code, active.codeHash, email, purpose)) {
    active.attempts += 1;
    await active.save();
    const remaining = active.maxAttempts - active.attempts;
    throw new AppError(
      remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Incorrect code. Please request a new code.',
      400,
      'OTP_INVALID'
    );
  }
  active.usedAt = new Date();
  await active.save();
  return { otp: active, valid: true };
}
async function canResend(email, purpose) {
  const recent = await Otp.findOne({ email: email.toLowerCase(), purpose, resendCount: { $gt: 0 } }).sort({ createdAt: -1 });
  if (recent && recent.lastResentAt && Date.now() - new Date(recent.lastResentAt).getTime() < 45000) {
    throw new AppError('Please wait about 45 seconds before requesting another code.', 429, 'OTP_COOLDOWN');
  }
  if (recent && recent.resendCount >= MAX_RESENDS) {
    throw new AppError('Maximum resend limit reached. Please try again later.', 429, 'OTP_RESEND_LIMIT');
  }
  return true;
}
module.exports = { issueOtp, verifyOtp, canResend };
