const FACTOR_WEIGHTS = {
  sourceReliability: { label: 'Source Reliability', weight: 0.22 },
  evidenceQuality: { label: 'Evidence Quality', weight: 0.22 },
  claimConsistency: { label: 'Claim Consistency', weight: 0.22 },
  publicationTransparency: { label: 'Publication Transparency', weight: 0.13 },
  writingQuality: { label: 'Writing Quality', weight: 0.08 },
  sensationalism: { label: 'Sensationalism', weight: 0.13 }
};
function verdictFor(score) {
  if (score >= 80) return 'Highly Credible';
  if (score >= 65) return 'Mostly Credible';
  if (score >= 45) return 'Uncertain';
  if (score >= 25) return 'Potentially Misleading';
  return 'Highly Suspicious';
}
function clamp(n) {
  return Math.round(Math.max(0, Math.min(100, n)));
}
// The AI model may only nudge a measured baseline; the application owns the final number.
function blendWithBaseline(aiValue, baseline, maxDelta = 15) {
  if (typeof baseline !== 'number') return typeof aiValue === 'number' ? clamp(aiValue) : null;
  if (typeof aiValue !== 'number') return clamp(baseline);
  return clamp(Math.max(baseline - maxDelta, Math.min(baseline + maxDelta, aiValue)));
}
function calculateCredibility(input, context = {}) {
  const { sourceReliability, evidenceQuality, claimConsistency, publicationTransparency, writingQuality, sensationalism } = input;
  const exclusionReasons = context.exclusionReasons || {};
  const factors = {};
  factors.sourceReliability = sourceReliability;
  factors.evidenceQuality = evidenceQuality;
  factors.claimConsistency = claimConsistency;
  factors.publicationTransparency = publicationTransparency;
  factors.writingQuality = writingQuality;
  factors.sensationalism = sensationalism;
  let weightedSum = 0;
  let weightTotal = 0;
  const breakdown = [];
  for (const [key, meta] of Object.entries(FACTOR_WEIGHTS)) {
    const value = factors[key];
    if (value === null) {
      breakdown.push({
        key,
        label: meta.label,
        score: null,
        weight: meta.weight,
        reason: exclusionReasons[key] || 'Not assessed — not enough independent information was available for this factor.',
        excluded: true
      });
      continue;
    }
    const final = clamp(value);
    factors[key] = final;
    weightedSum += final * meta.weight;
    weightTotal += meta.weight;
    breakdown.push({
      key,
      label: meta.label,
      score: final,
      weight: meta.weight,
      reason: reasonForFactor(key, final, meta.weight),
      excluded: false
    });
  }
  let overall = weightTotal > 0 ? clamp(weightedSum / weightTotal) : 50;
  const capsApplied = [];
  const applyCap = (limit, note) => {
    if (overall > limit) {
      overall = limit;
      capsApplied.push(note);
    }
  };
  if (context.criticalContradicted > 0) applyCap(44, 'Capped: a critical claim is contradicted.');
  else if (context.contradicted >= 2) applyCap(50, 'Capped: multiple claims are contradicted.');
  else if (context.contradicted === 1) applyCap(64, 'Capped: a claim is contradicted.');
  if (typeof sensationalism === 'number') {
    if (sensationalism < 30) applyCap(44, 'Capped: heavy sensational and clickbait language.');
    else if (sensationalism < 45) applyCap(58, 'Capped: strong sensational language.');
  }
  if (context.sourceClassification === 'High Risk') applyCap(48, 'Capped: publisher is classified High Risk in the source registry.');
  if (context.claimsTotal >= 3 && context.unsupportedShare >= 0.6) applyCap(55, 'Capped: most claims lack supporting evidence.');
  const measuredWeight = Math.round(weightTotal * 100);
  let confidence = 'High';
  if (context.mode === 'heuristic' || measuredWeight < 70 || !context.externalAvailable) confidence = 'Medium';
  if ((context.mode === 'heuristic' && !context.externalAvailable) || measuredWeight < 50) confidence = 'Low';
  return {
    overall,
    capsApplied,
    confidence,
    measuredWeight,
    verdict: verdictFor(overall),
    factors: factors,
    breakdown,
    weights: FACTOR_WEIGHTS,
    excludedFactorKeys: Object.entries(factors).filter(([, v]) => v === null).map(([k]) => k)
  };
}
function reasonForFactor(key, score, weight) {
  const pct = Math.round(weight * 100);
  if (key === 'sourceReliability') {
    return score >= 80 ? 'Registry and transparency signals indicate a generally reliable publisher.' : score >= 50 ? 'Publisher shows mixed or partially transparent signals.' : 'Weak publisher transparency signals or high-risk registry classification.';
  }
  if (key === 'evidenceQuality') return score >= 70 ? 'Claims are supported by citations, data or attributed sources.' : score >= 45 ? 'Some evidence is present but coverage is uneven.' : 'The article provides little verifiable supporting evidence.';
  if (key === 'claimConsistency') return score >= 70 ? 'Important claims are internally consistent and largely supported.' : score >= 45 ? 'Some claims lack support or show partial inconsistency.' : 'Important claims are contradicted or lack supporting basis.';
  if (key === 'publicationTransparency') return score >= 70 ? 'Author, publisher and date information is clearly disclosed.' : score >= 45 ? 'Some publication details are present, others are missing.' : 'Key publication details (author, date, publisher) are missing.';
  if (key === 'writingQuality') return score >= 70 ? 'Writing is structured, specific and comparatively neutral.' : score >= 45 ? 'Writing quality is acceptable but shows some objectivity issues.' : 'Writing shows strong objectivity problems or is poorly structured.';
  if (key === 'sensationalism') return score >= 70 ? 'Little clickbait or sensational language detected.' : score >= 45 ? 'Noticeable sensational or clickbait elements detected.' : 'Heavy sensationalism and clickbait-style language detected.';
  return `Factor ${key} scored ${score}/100 (weight ${pct}%).`;
}
module.exports = { calculateCredibility, blendWithBaseline, verdictFor, FACTOR_WEIGHTS, clamp };
