const axios = require('axios');
const env = require('../config/env');
const SCOPES = 'openid email profile';
const stateStore = new Map();
function isConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret);
}
function createState() {
  const token = [...Array(24)].map(() => Math.floor(Math.random() * 36).toString(36)).join('');
  stateStore.set(token, Date.now());
  return token;
}
function consumeState(token) {
  const created = stateStore.get(token);
  if (!created) return false;
  if (Date.now() - created > 10 * 60 * 1000) {
    stateStore.delete(token);
    return false;
  }
  stateStore.delete(token);
  return true;
}
function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleCallbackUrl,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'online',
    include_granted_scopes: 'true',
    prompt: 'select_account',
    state: createState()
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
async function exchangeCode(code) {
  const tokenRes = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleCallbackUrl,
      grant_type: 'authorization_code'
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );
  const accessToken = tokenRes.data.access_token;
  const idToken = tokenRes.data.id_token;
  const profileRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000
  });
  const profile = profileRes.data;
  return {
    profile: {
      googleId: profile.sub,
      email: String(profile.email || '').toLowerCase(),
      name: profile.name || profile.email || 'Google User',
      picture: profile.picture || null,
      emailVerified: Boolean(profile.email_verified)
    },
    idToken
  };
}
async function verifyIdToken(idToken) {
  const res = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
    params: { id_token: idToken },
    timeout: 15000
  });
  const data = res.data;
  if (!data || !data.sub || data.aud !== env.googleClientId) {
    throw new Error('Invalid Google ID token');
  }
  return {
    googleId: data.sub,
    email: String(data.email || '').toLowerCase(),
    name: data.name || data.email || 'Google User',
    picture: data.picture || null,
    emailVerified: data.email_verified === 'true'
  };
}
module.exports = { isConfigured, getAuthUrl, exchangeCode, consumeState, verifyIdToken };
