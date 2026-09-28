const Claim = require('../models/Claim');
const WEIGHTS = {
  Contradicted: 10,
  Unsupported: 25,
  'Needs Verification': 48,
  'Partially Supported': 68,
  Supported: 92
};
function contradictsInternal(claimQuote, contradictions) {
  return (contradictions || []).some((c) => {
    const a = String(c.quoteA || '').toLowerCase();
    const b = String(claimQuote || '').toLowerCase();
    if (!a || !b) return false;
    const probe = a.slice(0, 40);
    return probe.length > 15 && (b.includes(probe) || a.includes(b.slice(0, 40)));
  });
}
function mapAssessment(raw, extRes, contradictions) {
  const externallyContradicted = extRes && extRes.position === 'Contradicted';
  const externallySupported = extRes && (extRes.position === 'Supported' || extRes.position === 'Partially Supported');
  if (contradictsInternal(raw.quote, contradictions) || externallyContradicted) return 'Contradicted';
  if (externallySupported) {
    return raw.inTextSupport === 'partial' && extRes.position === 'Partially Supported' ? 'Partially Supported' : 'Supported';
  }
  if (raw.inTextSupport === 'supported') return 'Partially Supported';
  if (raw.inTextSupport === 'partial') return 'Partially Supported';
  if (extRes && extRes.position === 'Unsupported') return 'Unsupported';
  return 'Needs Verification';
}
function confidenceFor(assessment, extRes, inTextSupport) {
  let base = WEIGHTS[assessment];
  if (extRes) base = base * 0.6 + (extRes.confidence || 50) * 0.4;
  if (inTextSupport === 'supported') base = Math.min(96, base + 6);
  if (!extRes && assessment === 'Needs Verification') base = Math.min(base, 60);
  return Math.max(5, Math.min(95, Math.round(base)));
}
function mapAll(rawClaims, externalResults, contradictions) {
  const results = (externalResults && externalResults.results) || [];
  const seen = new Set();
  const mapped = [];
  for (const raw of rawClaims || []) {
    const quote = String(raw.quote || '').trim();
    if (!quote || quote.length < 20 || seen.has(quote.slice(0, 60))) continue;
    seen.add(quote.slice(0, 60));
    const index = results.findIndex((r) => String(r.claimText || '').trim() === quote);
    const extRes = index >= 0 ? results[index] : null;
    const assessment = mapAssessment(raw, extRes, contradictions);
    const supporting = [];
    const contradicting = [];
    if (extRes) {
      for (const src of extRes.sources || []) {
        const text = `${src.title} — ${src.url}`;
        if (src.stance === 'Contradicts') contradicting.push(text);
        else supporting.push(text);
      }
    }
    mapped.push({
      raw,
      claimText: quote.slice(0, 1200),
      importance: raw.importance || 'Medium',
      assessment,
      confidence: confidenceFor(assessment, extRes, raw.inTextSupport),
      supportingEvidence: supporting.slice(0, 6),
      contradictingEvidence: contradicting.slice(0, 6),
      explanation: [
        raw.supportNote,
        extRes ? `External check: ${extRes.evidenceSummary || 'no summary'}` : 'No independent external sources were retrieved for this claim during this analysis.'
      ]
        .filter(Boolean)
        .join(' ')
        .slice(0, 900),
      externalSources: (extRes && extRes.sources || []).slice(0, 4)
    });
  }
  return mapped;
}
async function persistMapped(mapped, analysisId, articleId) {
  const saved = [];
  for (const item of mapped) {
    const doc = await Claim.create({
      analysis: analysisId,
      article: articleId,
      claimText: item.claimText,
      importance: item.importance,
      assessment: item.assessment,
      confidence: item.confidence,
      supportingEvidence: item.supportingEvidence,
      contradictingEvidence: item.contradictingEvidence,
      explanation: item.explanation,
      externalSources: item.externalSources
    });
    saved.push(doc);
  }
  return saved;
}
function claimStats(mapped) {
  const total = mapped.length || 0;
  if (!total) return { total: 0, supported: 0, partial: 0, needsVerification: 0, contradicted: 0, unsupported: 0, consistencyScore: 50 };
  const count = (a) => mapped.filter((c) => c.assessment === a).length;
  const stats = {
    total,
    supported: count('Supported'),
    partial: count('Partially Supported'),
    needsVerification: count('Needs Verification'),
    contradicted: count('Contradicted'),
    unsupported: count('Unsupported'),
    consistencyScore: 50
  };
  const weighted = mapped.reduce((sum, c) => sum + WEIGHTS[c.assessment], 0);
  stats.consistencyScore = Math.round(weighted / total);
  return stats;
}
module.exports = { mapAll, persistMapped, claimStats, WEIGHTS };
