const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/([\w-]+\.)+[\w-]+(:[0-9]{1,5})?(\/\S*)?$/i;
function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}
function isHttpUrl(value) {
  return typeof value === 'string' && value.length <= 2048 && URL_RE.test(value);
}
function hasStrongPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}
function cleanText(value, maxLen = 4000) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}
// Cleans pasted article text while preserving paragraph structure (unlike cleanText, which flattens it).
function cleanArticleText(value, maxLen = 20000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f​-‍﻿]/g, '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLen);
}
function normalizeDomain(raw) {
  if (!raw) return null;
  let d = String(raw).toLowerCase().trim();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '');
  d = d.split(/[/?#]/)[0];
  d = d.split(':')[0];
  return d || null;
}
function pagination(query, fallback = 10, max = 50) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(max, Math.max(1, parseInt(query.limit, 10) || fallback));
  return { page, limit, skip: (page - 1) * limit };
}
module.exports = { cleanArticleText, isEmail, isHttpUrl, hasStrongPassword, cleanText, normalizeDomain, pagination };
