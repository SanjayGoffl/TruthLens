const axios = require('axios');
const env = require('../config/env');
const cache = require('./cacheService');

// Published fact-checks for a claim (Google Fact Check Tools API). Informational only:
// ratings are free text from many publishers, so they never change the numeric score.
function isConfigured() {
  return Boolean(env.factCheckApiKey);
}

function shape(claims) {
  const out = [];
  for (const c of claims || []) {
    for (const r of c.claimReview || []) {
      if (!r.url) continue;
      out.push({ publisher: (r.publisher && r.publisher.name) || 'Fact-checker', title: r.title || c.text || 'Fact-check', url: r.url, rating: r.textualRating || '' });
    }
  }
  return out.slice(0, 3);
}

async function search(query, http = axios) {
  if (!isConfigured() || !query) return [];
  const text = String(query).slice(0, 200);
  const { value } = await cache.remember(`factcheck:${cache.hash(text)}`, 24 * 3600, async () => {
    try {
      const res = await http.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
        params: { query: text, key: env.factCheckApiKey, pageSize: 3, languageCode: 'en' },
        timeout: 8000
      });
      return shape(res.data && res.data.claims);
    } catch (err) {
      return null;
    }
  });
  return value || [];
}

module.exports = { isConfigured, search, shape };
