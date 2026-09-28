const axios = require('axios');
const env = require('../config/env');
const gemini = require('./geminiService');
const sourceService = require('./sourceService');
const CLAIM_MAX = 3;
function buildQuery(claimText) {
  const cleaned = String(claimText)
    .replace(/["'“”‘’]/g, '')
    .replace(/[^\w\s.,%₹]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned.split(' ').filter((w) => w.length > 2 && !/^(the|and|that|this|with|from|have|has|was|were|for|are|but|not|its|his|her|their|about|said|says)$/i.test(w));
  return words.slice(0, 9).join(' ');
}
async function searchSerper(query, domain) {
  if (!env.serperApiKey) return null;
  const res = await axios.post(
    'https://google.serper.dev/search',
    { q: query, num: 6, gl: 'in' },
    { headers: { 'X-API-KEY': env.serperApiKey, 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  const items = (res.data && res.data.organic) || [];
  return items
    .filter((item) => {
      try {
        return item.link && item.title && new URL(item.link).hostname !== domain;
      } catch (err) {
        return false;
      }
    })
    .map((item) => ({ title: item.title, link: item.link, snippet: item.snippet || '' }))
    .slice(0, 6);
}
function stanceScore(position) {
  const map = { Supported: 92, 'Partially Supported': 68, 'Needs Verification': 50, Unsupported: 30, Contradicted: 12 };
  return map[position] !== undefined ? map[position] : 50;
}
async function verifyClaimsForArticle(claims, articleMeta, mode) {
  const eligible = claims.filter((c) => c.needsExternalCheck !== false).slice(0, CLAIM_MAX);
  if (!eligible.length) {
    return { available: false, method: 'no-claims', note: 'No externally checkable claims were identified.' };
  }
  if (mode === 'heuristic' && !env.serperApiKey) {
    return { available: false, method: 'none', note: 'External verification was not available for this analysis. Claims were not compared against other sources.' };
  }
  let results = null;
  let method = '';
  if (gemini.isConfigured()) {
    try {
      results = await gemini.groundedClaimCheck(eligible, articleMeta);
      if (results) method = 'Gemini grounded web search';
    } catch (err) {
      results = null;
    }
  }
  if (!results && env.serperApiKey) {
    try {
      const perClaim = [];
      for (const claim of eligible) {
        const query = buildQuery(claim.quote);
        const snippets = await searchSerper(query, articleMeta.domain);
        if (!snippets.length) {
          perClaim.push({ index: eligible.indexOf(claim), position: 'Needs Verification', confidence: 30, evidenceSummary: 'No relevant independent results returned for this claim.', sources: [] });
          continue;
        }
        const classified = await gemini.classifySnippets(claim, snippets);
        if (classified && classified.position) {
          perClaim.push({
            index: eligible.indexOf(claim),
            position: classified.position,
            confidence: typeof classified.confidence === 'number' ? classified.confidence : 50,
            evidenceSummary: classified.evidenceSummary || 'Classified from web search results.',
            sources: (classified.sources || []).map((s) => ({ title: s.title, url: s.url, stance: s.stance }))
          });
        } else {
          perClaim.push({ index: eligible.indexOf(claim), position: 'Needs Verification', confidence: 40, evidenceSummary: 'Results found but could not be stance-classified.', sources: [] });
        }
      }
      results = perClaim;
      method = 'Serper web search + Gemini stance analysis';
    } catch (err) {
      results = null;
    }
  }
  if (!results) {
    return { available: false, method: 'none', note: 'External verification is temporarily unavailable. Claims were not compared against other sources.' };
  }
  const enriched = [];
  for (const r of results) {
    const claim = eligible[r.index];
    if (!claim) continue;
    const sourcesWithReliability = (r.sources || []).map((s) => {
      const dom = (() => {
        try {
          return new URL(s.url).hostname;
        } catch (err) {
          return null;
        }
      })();
      return { title: s.title, url: s.url, stance: s.stance || 'Neutral', reliability: dom ? sourceService.classificationForScore(45) : '' };
    });
    enriched.push({
      index: r.index,
      claimText: claim.quote,
      position: r.position || 'Needs Verification',
      confidence: typeof r.confidence === 'number' ? r.confidence : 50,
      evidenceSummary: r.evidenceSummary || '',
      sources: sourcesWithReliability.slice(0, 4),
      score: stanceScore(r.position || 'Needs Verification')
    });
  }
  if (enriched.length < eligible.length) {
    const covered = new Set(enriched.map((e) => e.index));
    for (const claim of eligible) {
      if (!covered.has(eligible.indexOf(claim))) {
        enriched.push({ index: eligible.indexOf(claim), claimText: claim.quote, position: 'Needs Verification', confidence: 30, evidenceSummary: 'Could not be verified externally.', sources: [], score: 50 });
      }
    }
  }
  const avg = Math.round(enriched.reduce((sum, e) => sum + e.score, 0) / Math.max(1, enriched.length));
  const note =
    avg >= 75
      ? 'Independent sources largely corroborate the checked claims.'
      : avg >= 55
      ? 'Independent sources partially corroborate the checked claims, with gaps.'
      : avg >= 30
      ? 'Independent sources show little agreement with the checked claims; proceed with caution.'
      : 'Independent sources mostly contradict or fail to support the checked claims.';
  return { available: true, method, note, results: enriched, averageAgreement: avg };
}
module.exports = { verifyClaimsForArticle };
