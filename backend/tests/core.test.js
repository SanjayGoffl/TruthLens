const test = require('node:test');
const assert = require('node:assert/strict');
const credibility = require('../services/credibilityService');
const heuristic = require('../services/heuristicService');
const cache = require('../services/cacheService');
const { cleanArticleText } = require('../utils/validate');
const { scrub } = require('../middleware/sanitize');
const { assertPublicHost } = require('../utils/safeFetch');

const balanced = { sourceReliability: 80, evidenceQuality: 80, claimConsistency: 80, publicationTransparency: 80, writingQuality: 80, sensationalism: 80 };

test('weights sum to 1 and a uniform 80 scores 80', () => {
  const total = Object.values(credibility.FACTOR_WEIGHTS).reduce((s, f) => s + f.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.equal(credibility.calculateCredibility(balanced).overall, 80);
});

test('unmeasurable factors are excluded and weights renormalised', () => {
  const r = credibility.calculateCredibility({ ...balanced, sourceReliability: null, publicationTransparency: null });
  assert.equal(r.overall, 80);
  assert.deepEqual(r.excludedFactorKeys.sort(), ['publicationTransparency', 'sourceReliability']);
});

test('caps limit the score for contradicted critical claims and High Risk sources', () => {
  const a = credibility.calculateCredibility(balanced, { criticalContradicted: 1, contradicted: 1 });
  assert.equal(a.overall, 44);
  const b = credibility.calculateCredibility(balanced, { sourceClassification: 'High Risk' });
  assert.equal(b.overall, 48);
  assert.ok(b.capsApplied.length === 1);
});

test('AI sub-scores are bounded around the measured baseline', () => {
  assert.equal(credibility.blendWithBaseline(5, 70, 15), 55);
  assert.equal(credibility.blendWithBaseline(100, 70, 15), 85);
  assert.equal(credibility.blendWithBaseline(undefined, 70), 70);
});

test('heuristic analyzer rates clickbait higher than neutral reporting', () => {
  const bad = heuristic.analyzeHeuristically({ title: 'Shocking truth', content: "You won't believe this shocking disaster! Everyone knows it is a scandal!!", mode: 'content' });
  const good = heuristic.analyzeHeuristically({ title: 'Council approves budget', content: 'The city council approved the budget on Tuesday, according to a statement from the mayor.', mode: 'content' });
  assert.ok(bad.languageAnalysis.clickbaitScore > good.languageAnalysis.clickbaitScore);
});

test('pasted text keeps paragraphs and drops markup', () => {
  assert.equal(cleanArticleText('A  b\r\n\r\n\r\n<p>C</p>​ d'), 'A b\n\nC\nd');
});

test('Mongo operator keys are stripped from input', () => {
  assert.deepEqual(scrub({ email: { $ne: null }, ok: 'x', 'a.b': 1 }), { email: {}, ok: 'x' });
});

test('SSRF guard blocks private and metadata addresses', async () => {
  for (const host of ['127.0.0.1', 'localhost', '169.254.169.254', '10.1.2.3', '192.168.0.1', '[::1]']) {
    await assert.rejects(() => assertPublicHost(host), { code: 'URL_NOT_ALLOWED' });
  }
});

test('cache falls back to memory and only runs the producer once', async () => {
  let calls = 0;
  const produce = async () => ({ n: ++calls });
  await cache.remember('t:key', 5, produce);
  const second = await cache.remember('t:key', 5, produce);
  assert.equal(calls, 1);
  assert.equal(second.hit, true);
  assert.equal(cache.status().backend, 'memory');
});
