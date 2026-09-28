const dns = require('dns').promises;
const net = require('net');
const axios = require('axios');
const AppError = require('./AppError');

function isPrivateIPv4(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === '::1' || v6 === '::') return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
}

async function assertPublicHost(hostname) {
  const blocked = () => new AppError('That address is not allowed. Please use a public news article URL.', 400, 'URL_NOT_ALLOWED');
  const host = hostname.replace(/^\[|\]$/g, '');
  if (/^localhost$|\.local$|\.internal$/i.test(host)) throw blocked();
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw blocked();
    return;
  }
  let records;
  try {
    records = await dns.lookup(host, { all: true });
  } catch (err) {
    throw new AppError('Could not resolve that website. Please check the URL.', 422, 'URL_UNRESOLVABLE');
  }
  if (!records.length || records.some((r) => isPrivateAddress(r.address))) throw blocked();
}

// Fetches a public web page. Redirects are followed manually so every hop is re-validated (SSRF guard).
async function safeGet(url, options = {}, maxHops = 5) {
  let current = url;
  for (let hop = 0; hop <= maxHops; hop += 1) {
    const parsed = new URL(current);
    if (!/^https?:$/.test(parsed.protocol)) throw new AppError('Only http(s) URLs are supported.', 400, 'URL_NOT_ALLOWED');
    if (parsed.username || parsed.password) throw new AppError('URLs with embedded credentials are not allowed.', 400, 'URL_NOT_ALLOWED');
    await assertPublicHost(parsed.hostname);
    const response = await axios.get(current, {
      ...options,
      maxRedirects: 0,
      maxContentLength: options.maxContentLength || 3000000,
      validateStatus: (s) => s >= 200 && s < 400
    });
    if (response.status >= 300 && response.headers.location) {
      current = new URL(response.headers.location, current).toString();
      continue;
    }
    return { response, finalUrl: current };
  }
  throw new AppError('The link redirected too many times.', 422, 'TOO_MANY_REDIRECTS');
}

module.exports = { safeGet, assertPublicHost, isPrivateAddress };
