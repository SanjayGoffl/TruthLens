// Strips MongoDB operator injection ($-prefixed keys, dotted keys) from user-controlled input.
function scrub(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  const out = {};
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || key === '__proto__') continue;
    out[key] = scrub(value[key], depth + 1);
  }
  return out;
}

function sanitizeInput(req, res, next) {
  if (req.body) req.body = scrub(req.body);
  if (req.query) {
    const cleaned = scrub({ ...req.query });
    Object.defineProperty(req, 'query', { value: cleaned, writable: true, configurable: true, enumerable: true });
  }
  next();
}

module.exports = { sanitizeInput, scrub };
