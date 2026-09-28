const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/newsguard_ai',
  jwtSecret: process.env.JWT_SECRET || 'insecure_dev_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  factCheckApiKey: process.env.FACTCHECK_API_KEY || '',
  redisUrl: process.env.REDIS_URL || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  serperApiKey: process.env.SERPER_API_KEY || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  googleAdminEmail: process.env.GOOGLE_ADMIN_EMAIL || '',
  mailHost: process.env.MAIL_HOST || 'smtp.gmail.com',
  mailPort: parseInt(process.env.MAIL_PORT, 10) || 587,
  mailUsername: process.env.MAIL_USERNAME || '',
  mailPassword: process.env.MAIL_PASSWORD || '',
  mailFrom: process.env.MAIL_FROM || 'TruthLens AI <noreply@newsguard.local>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES, 10) || 10,
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  adminName: process.env.ADMIN_NAME || 'Administrator',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || ''
};
const WEAK_SECRETS = ['insecure_dev_secret_change_me', 'change_me_to_a_long_random_secret'];
if (env.nodeEnv === 'production') {
  if (WEAK_SECRETS.includes(env.jwtSecret) || env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
  }
} else if (WEAK_SECRETS.includes(env.jwtSecret)) {
  console.warn('[security] Using the default development JWT secret. Set JWT_SECRET before deploying.');
}
module.exports = env;
