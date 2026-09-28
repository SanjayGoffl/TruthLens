const Source = require('../models/Source');
const { normalizeDomain } = require('../utils/validate');
const CLASSIFICATION_LEVELS = [
  { label: 'Trusted', min: 80 },
  { label: 'Generally Reliable', min: 65 },
  { label: 'Mixed', min: 45 },
  { label: 'Limited Information', min: 25 },
  { label: 'High Risk', min: 0 }
];
function classificationForScore(score) {
  const found = CLASSIFICATION_LEVELS.find((c) => score >= c.min);
  return found ? found.label : 'Limited Information';
}
function scoreForClassification(label) {
  const map = { Trusted: 85, 'Generally Reliable': 70, Mixed: 55, 'Limited Information': 40, 'High Risk': 22 };
  return map[label] !== undefined ? map[label] : 40;
}
function normalizeName(name) {
  if (!name) return null;
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function findInDb(sources, domain, publisher) {
  if (!domain && !publisher) return null;
  const dom = normalizeDomain(domain);
  if (dom) {
    const byDomain = sources.find((s) => normalizeDomain(s.domain) === dom || s.domain === dom);
    if (byDomain) return byDomain;
  }
  const name = normalizeName(publisher);
  if (name) {
    const byName = sources.find((s) => normalizeName(s.name) === name);
    if (byName) return byName;
  }
  return null;
}
async function profileForArticle(articleMeta) {
  const domain = normalizeDomain(articleMeta.domain);
  let dbSource = null;
  if (domain) {
    const sources = await Source.find({}).lean();
    dbSource = findInDb(sources, domain, articleMeta.publisher);
  }
  const base = dbSource ? { score: dbSource.reliabilityScore, classification: dbSource.classification, known: true } : { score: 40, classification: 'Limited Information', known: false };
  return { dbSource: dbSource || null, ...base };
}
function computeReliability(profile, signals) {
  let score = profile.score;
  const reasons = [];
  if (profile.known) {
    reasons.push(`Source registry record: "${profile.dbSource.name}" is classified ${profile.classification} (registry score ${profile.score}/100).`);
    if (profile.dbSource.status === 'inactive') score = Math.max(10, score - 25);
  } else {
    reasons.push('This publisher has no record in the TruthLens AI source registry yet — only limited information is available about its reputation.');
  }
  const authorPresent = signals.authorPresence === 'present';
  const authorPartial = signals.authorPresence === 'partial';
  const datePresent = Boolean(signals.publicationDatePresence);
  const identityStated = Boolean(signals.identity && signals.identity.toLowerCase() !== 'not stated');
  if (authorPresent) {
    score += 10;
    reasons.push('A named author (byline) is present, which supports accountability.');
  } else if (authorPartial) {
    score += 4;
    reasons.push('Author information is only partially present.');
  } else {
    score -= 10;
    reasons.push('No author/byline is identifiable, reducing accountability.');
  }
  if (datePresent) {
    score += 7;
    reasons.push('A publication date is present.');
  } else {
    score -= 7;
    reasons.push('No publication date is visible, making the article hard to contextualize.');
  }
  if (identityStated) {
    score += 5;
    reasons.push('Publisher identity is clearly stated.');
  } else {
    score -= 6;
    reasons.push('Publisher identity is not clearly stated in the article metadata.');
  }
  const aiConcerns = (signals.sourceConcerns || []).length;
  if (aiConcerns > 0) score -= Math.min(10, aiConcerns * 3);
  const finalScore = Math.round(Math.max(3, Math.min(98, score)));
  return {
    score: finalScore,
    classification: classificationForScore(finalScore),
    known: profile.known,
    dbSource: profile.dbSource,
    reasons,
    transparency: { authorPresent, authorPartial, datePresent, identityStated }
  };
}
async function upsertFromAnalysis(article) {
  const domain = normalizeDomain(article.domain);
  const name = article.publisher || (domain ? domain.replace(/\.\w+$/, '') : null);
  if (!domain || !name) return null;
  const existing = await Source.findOne({ domain });
  if (existing) return existing;
  const created = await Source.create({
    name: String(name).slice(0, 120),
    domain,
    reliabilityScore: 40,
    classification: 'Limited Information',
    notes: 'Auto-registered after an article from this domain was analyzed. Classification will improve as more evidence is gathered.',
    status: 'active',
    category: 'News',
    country: ''
  });
  return created;
}
function statsForSources(items, analysisCounts) {
  return items.map((s) => ({
    ...s,
    analyzedArticles: analysisCounts.get(String(s.domain)) || 0
  }));
}
module.exports = { classificationForScore, scoreForClassification, profileForArticle, computeReliability, upsertFromAnalysis, statsForSources, CLASSIFICATION_LEVELS };
