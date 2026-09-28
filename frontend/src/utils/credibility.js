export const VERDICTS = [
  { label: 'Highly Credible', min: 80, color: '#16A34A' },
  { label: 'Mostly Credible', min: 65, color: '#059669' },
  { label: 'Uncertain', min: 45, color: '#D97706' },
  { label: 'Potentially Misleading', min: 25, color: '#EA580C' },
  { label: 'Highly Suspicious', min: 0, color: '#DC2626' }
];
export function verdictFor(score) {
  const n = typeof score === 'number' ? score : Number(score);
  if (Number.isNaN(n)) return 'Uncertain';
  return (VERDICTS.find((v) => n >= v.min) || VERDICTS[2]).label;
}
export function colorForScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return '#D97706';
  return (VERDICTS.find((v) => score >= v.min) || VERDICTS[2]).color;
}
export function colorForVerdict(label) {
  const found = VERDICTS.find((v) => v.label === label);
  return found ? found.color : '#D97706';
}
export const CLAIM_ASSESSMENTS = [
  { label: 'Supported', color: '#16A34A', chip: 'chip-green' },
  { label: 'Partially Supported', color: '#059669', chip: 'chip-teal' },
  { label: 'Needs Verification', color: '#D97706', chip: 'chip-amber' },
  { label: 'Unsupported', color: '#EA580C', chip: 'chip-orange' },
  { label: 'Contradicted', color: '#DC2626', chip: 'chip-red' }
];
export function claimMeta(assessment) {
  return CLAIM_ASSESSMENTS.find((a) => a.label === assessment) || CLAIM_ASSESSMENTS[2];
}
export const STANCE_META = {
  Supports: { color: '#16A34A', chip: 'chip-green' },
  Partial: { color: '#D97706', chip: 'chip-amber' },
  Contradicts: { color: '#DC2626', chip: 'chip-red' },
  Neutral: { color: '#64748B', chip: 'chip-gray' }
};
export function stanceMeta(stance) {
  return STANCE_META[stance] || STANCE_META.Neutral;
}
export const SUSPICIOUS_CATEGORY_META = {
  'Unsupported claim': { color: '#EA580C', chip: 'chip-orange' },
  'Missing evidence': { color: '#D97706', chip: 'chip-amber' },
  'Contradiction': { color: '#DC2626', chip: 'chip-red' },
  'Extreme or generalized statement': { color: '#EA580C', chip: 'chip-orange' },
  'Sensational language': { color: '#D97706', chip: 'chip-amber' },
  'Suspicious publication information': { color: '#64748B', chip: 'chip-gray' }
};
export function categoryMeta(cat) {
  return SUSPICIOUS_CATEGORY_META[cat] || { color: '#64748B', chip: 'chip-gray' };
}
export const FLAG_STATUS_META = {
  pending: { label: 'Pending review', chip: 'chip-amber' },
  reviewed: { label: 'Reviewed', chip: 'chip-blue' },
  verified: { label: 'Verified', chip: 'chip-green' },
  suspicious: { label: 'Suspicious', chip: 'chip-red' }
};
export function flagStatusMeta(status) {
  return FLAG_STATUS_META[status] || FLAG_STATUS_META.pending;
}
export const SOURCE_CLASS_META = {
  Trusted: { chip: 'chip-green', color: '#16A34A' },
  'Generally Reliable': { chip: 'chip-teal', color: '#059669' },
  Mixed: { chip: 'chip-amber', color: '#D97706' },
  'Limited Information': { chip: 'chip-gray', color: '#64748B' },
  'High Risk': { chip: 'chip-red', color: '#DC2626' }
};
export function sourceClassMeta(label) {
  return SOURCE_CLASS_META[label] || SOURCE_CLASS_META['Limited Information'];
}
export const FACTORS = [
  { key: 'sourceReliability', label: 'Source Reliability' },
  { key: 'evidenceQuality', label: 'Evidence Quality' },
  { key: 'claimConsistency', label: 'Claim Consistency' },
  { key: 'publicationTransparency', label: 'Publication Transparency' },
  { key: 'writingQuality', label: 'Writing Quality' },
  { key: 'sensationalism', label: 'Sensationalism' }
];
export function weightPct(weight) {
  return Math.round((weight || 0) * 100);
}
export function initials(name) {
  return String(name || '?').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}
export function fmtDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
}
export function timeAgo(value) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(value);
}
export function truncate(text, len = 90) {
  const s = String(text || '');
  return s.length > len ? `${s.slice(0, len)}…` : s;
}
export function domainOf(url) {
  try {
    return String(new URL(url).hostname).replace(/^www\./, '');
  } catch (err) {
    return url || null;
  }
}
export function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 400);
}
export function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'USER';
  } catch (err) {
    return 'USER';
  }
}
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
export function resizeImageDataUrl(dataUrl, maxDim = 256) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
export function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}
