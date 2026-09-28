const Article = require('../models/Article');
const Analysis = require('../models/Analysis');
const FlaggedArticle = require('../models/FlaggedArticle');
const Notification = require('../models/Notification');
const geminiService = require('./geminiService');
const heuristicService = require('./heuristicService');
const articleService = require('./articleService');
const sourceService = require('./sourceService');
const verificationService = require('./verificationService');
const claimService = require('./claimService');
const factCheckService = require('./factCheckService');
const credibilityService = require('./credibilityService');
const { clamp, verdictFor } = credibilityService;
const { normalizeDomain, cleanText, cleanArticleText } = require('../utils/validate');
const cache = require('./cacheService');
const AppError = require('../utils/AppError');
const DISCLAIMER = 'AI-generated credibility assessments are informational and should not be treated as definitive proof of truth or falsehood. Always verify important information using reliable primary and independent sources.';
function buildArticleMeta(doc, mode) {
  return {
    title: doc.title,
    content: doc.content,
    domain: doc.domain,
    publisher: doc.publisher,
    author: doc.author,
    publicationDateText: doc.publicationDateText,
    mode
  };
}
async function runAiOrHeuristic(meta) {
  const baseline = heuristicService.analyzeHeuristically(meta);
  if (geminiService.isConfigured()) {
    try {
      const key = `ai:${geminiService.MODEL}:${cache.hash(meta.title, meta.content)}`;
      const { value: parsed } = await cache.remember(key, 24 * 3600, async () => {
        const result = await geminiService.analyzeArticle(meta);
        return result && result.claims ? result : null;
      });
      if (parsed && parsed.claims) return { parsed, baseline, mode: 'ai' };
    } catch (err) {
      console.warn('Gemini analysis failed, falling back to heuristic mode:', err.message);
    }
  }
  return { parsed: baseline, baseline, mode: 'heuristic' };
}
function computePublicationTransparency(meta, signals) {
  let score = 0;
  const reasons = [];
  if (signals.authorPresent || (meta.author && meta.author !== 'Not stated')) {
    score += 35;
    reasons.push('Named author present in the article metadata.');
  } else if (signals.authorPartial) {
    score += 20;
    reasons.push('Author identity is only partially disclosed.');
  } else {
    reasons.push('No author is identified.');
  }
  if (signals.datePresent || meta.publicationDateText) {
    score += 30;
    reasons.push('Publication date is disclosed.');
  } else {
    reasons.push('Publication date is missing or unclear.');
  }
  if (meta.publisher && String(meta.publisher).toLowerCase() !== 'not stated') {
    score += 20;
    reasons.push('Publisher/brand is identified.');
  } else {
    reasons.push('Publisher identity is not stated.');
  }
  if (signals.identityStated) score += 5;
  if (score < 40 && meta.mode === 'content') {
    reasons.push('Pasted content provides no independent metadata about its origin.');
  }
  return { score: clamp(score), reasons };
}
function assembleExplanation(result) {
  const parts = [];
  parts.push(`The article received ${result.overall}/100, rated "${result.verdict}".`);
  const strong = result.breakdown.filter((f) => !f.excluded && f.score >= 70).map((f) => f.label.toLowerCase());
  const weak = result.breakdown.filter((f) => !f.excluded && f.score < 45).map((f) => f.label.toLowerCase());
  if (strong.length) parts.push(`Strengths: strong performance on ${strong.join(', ')}.`);
  if (weak.length) parts.push(`Weaknesses: notable weaknesses in ${weak.join(', ')}.`);
  const suspicious = result.suspiciousCount;
  if (suspicious > 0) parts.push(`${suspicious} statement${suspicious === 1 ? ' was' : 's were'} flagged as needing attention or verification.`);
  parts.push('This assessment reflects available signals and sources at analysis time. It is an aid to judgment, not a declaration that the article is true or false.');
  return parts.join(' ');
}
function flaggedReasonsFor(result, meta) {
  const reasons = [];
  if (result.verdict === 'Potentially Misleading' || result.verdict === 'Highly Suspicious') reasons.push('Low credibility');
  if (result.claimStats.unsupported > 0 || result.claimStats.contradicted > 0) reasons.push('Unsupported claims');
  if (result.contradictions.length > 0) reasons.push('Contradictions');
  if (result.language.sensationalismScore > 60 || result.language.clickbaitScore > 60) reasons.push('Suspicious language');
  if (meta.sourceProfile && meta.sourceProfile.classification === 'High Risk') reasons.push('Suspicious source');
  if (result.evidenceQuality < 40) reasons.push('Missing evidence');
  return reasons;
}
async function createFlaggedIfNeeded(payload) {
  const shouldFlag = ['Potentially Misleading', 'Highly Suspicious'].includes(payload.verdict) || payload.suspiciousStatements.length >= 3;
  if (!shouldFlag) return null;
  const reasons = flaggedReasonsFor(payload, payload.meta);
  if (!reasons.length) return null;
  const severity = payload.overall < 25 ? 'critical' : payload.overall < 45 ? 'high' : payload.verdict === 'Potentially Misleading' ? 'medium' : 'low';
  const existing = await FlaggedArticle.findOne({ analysis: payload.analysisId });
  if (existing) return existing;
  const flagged = await FlaggedArticle.create({
    analysis: payload.analysisId,
    article: payload.articleId,
    user: payload.userId,
    reasons: reasons.slice(0, 6),
    severity,
    status: 'pending',
    moderationNotes: ''
  });
  return flagged;
}
async function persistResult(payload) {
  const analysis = await Analysis.create(payload.analysisDoc);
  return analysis;
}
async function runFullAnalysis({ user, articleDoc, metaMode, articleEntity, onEvent }) {
  const emit = async (event) => {
    if (typeof onEvent === 'function') await onEvent(event);
  };
  await emit({ code: 'analysis-started', title: 'Article analysis started', message: 'Running the credibility pipeline for the submitted article.', level: 'info', type: 'analysis' });
  const meta = buildArticleMeta(articleDoc, metaMode);
  const { parsed: aiParsed, baseline, mode } = await runAiOrHeuristic(meta);
  const parsed = { ...aiParsed, sourceAnalysis: aiParsed.sourceAnalysis || baseline.sourceAnalysis };
  const isPaste = metaMode === 'content';
  const profile = await sourceService.profileForArticle(meta);
  const sourceProfile = { ...profile, dbSource: profile.dbSource ? profile.dbSource._id || profile.dbSource.id : null };
  const reliabilityFull = sourceService.computeReliability(profile, parsed.sourceAnalysis);
  // Pasted text has no verifiable origin: do not punish it as an unknown/high-risk publisher.
  const sourceAssessable = !isPaste; // a claimed domain on pasted text is unverified, so never inherits registry trust
  const reliability = sourceAssessable ? reliabilityFull : { ...reliabilityFull, score: null, classification: 'Not assessed', reasons: ['Pasted text has no verifiable publisher, so source reliability was not scored. Use an article link to include it.'] };
  await emit({ code: 'source-verified', title: 'Source verification completed', message: sourceAssessable ? `Publisher profile assessed${profile.dbSource ? ` from the registry (${profile.dbSource.name}, ${profile.classification})` : ' — no registry record, limited information only'}: ${reliability.score}/100.` : 'Pasted text has no verifiable publisher — source reliability was excluded from the score.', level: 'info', type: 'analysis' });
  if (sourceAssessable && reliability.score < 30) await emit({ code: 'low-reliability-source', title: 'Low-reliability source detected', message: `The publisher signals score only ${reliability.score}/100 (${reliability.classification}). Treat claims from it with extra caution.`, level: 'warning', type: 'alert' });
  const language = parsed.languageAnalysis || {};
  const baseLang = baseline.languageAnalysis;
  const sensRaw = credibilityService.blendWithBaseline(language.sensationalismScore, baseLang.sensationalismScore, 18);
  const clickRaw = credibilityService.blendWithBaseline(language.clickbaitScore, baseLang.clickbaitScore, 18);
  const contradictions = (parsed.contradictionCheck && parsed.contradictionCheck.internalContradictions) || [];
  const external = await verificationService.verifyClaimsForArticle(parsed.claims || [], meta, mode);
  const mappedClaims = claimService.mapAll(parsed.claims || [], external, contradictions);
  if (factCheckService.isConfigured()) {
    for (const item of mappedClaims.slice(0, 3)) {
      const found = await factCheckService.search(item.claimText);
      if (!found.length) continue;
      item.externalSources = [...(item.externalSources || []), ...found.map((f) => ({ title: `Fact-check (${f.publisher}): ${f.rating || 'see article'}`, url: f.url, position: 'Neutral', reliability: '' }))].slice(0, 6);
      item.explanation = `${item.explanation} Published fact-check: ${found[0].publisher} rated a similar claim "${found[0].rating || 'reviewed'}".`.slice(0, 900);
    }
  }
  const claimStats = claimService.claimStats(mappedClaims);
  await emit({ code: 'claim-verified', title: 'Claim verification completed', message: `${claimStats.total || 0} claim(s) extracted — ${claimStats.supported || 0} supported in text, ${claimStats.unsupported || 0} unsupported, ${claimStats.contradicted || 0} contradicted.`, level: claimStats.contradicted > 0 || claimStats.unsupported > 2 ? 'warning' : 'info', type: 'analysis' });
  if ((claimStats.unsupported || 0) > 0) await emit({ code: 'unsupported-claim', title: 'Unsupported claim detected', message: `${claimStats.unsupported} claim(s) lack supporting evidence inside the article.`, level: 'warning', type: 'alert' });
  if ((claimStats.contradicted || 0) > 0) await emit({ code: 'contradictory-claim', title: 'Contradictory claim detected', message: `${claimStats.contradicted} claim(s) conflict with other statements or evidence.`, level: 'warning', type: 'alert' });
  const transparency = computePublicationTransparency(meta, reliabilityFull.transparency);
    const transparencyAssessable = !isPaste; // self-declared metadata on pasted text is shown in the report but not scored
  const evidenceAi = parsed.evidenceAssessment || {};
  let evidenceScore = credibilityService.blendWithBaseline(evidenceAi.qualityScore, baseline.evidenceAssessment.qualityScore, 15);
  const claimEvidenceAdjust = mappedClaims.reduce((adj, c) => adj + (c.raw.inTextSupport === 'supported' ? 2 : c.raw.inTextSupport === 'none' ? -2 : 0), 0);
  evidenceScore = clamp(evidenceScore + Math.max(-10, Math.min(12, claimEvidenceAdjust)));
  const writingAi = parsed.writingAnalysis || {};
  const writingQuality = credibilityService.blendWithBaseline(writingAi.qualityScore, baseline.writingAnalysis.qualityScore, 15);
  const claimConsistencyRaw = claimStats.consistencyScore - Math.min(25, contradictions.length * 8);
  const sensationalismFactor = clamp(100 - (sensRaw * 0.55 + clickRaw * 0.45));
  await emit({ code: 'score-generated', title: 'Credibility score generated', message: 'All factors scored; weighted formula applied.', level: 'info', type: 'analysis' });
  const criticalContradicted = mappedClaims.filter((c) => c.assessment === 'Contradicted' && c.importance === 'Critical').length;
  const calculated = credibilityService.calculateCredibility(
    {
      sourceReliability: reliability.score,
      evidenceQuality: evidenceScore,
      claimConsistency: claimStats.total ? claimConsistencyRaw : null,
      publicationTransparency: transparencyAssessable ? transparency.score : null,
      writingQuality,
      sensationalism: sensationalismFactor
    },
    {
      mode,
      externalAvailable: Boolean(external && external.available),
      contradicted: claimStats.contradicted,
      criticalContradicted,
      claimsTotal: claimStats.total,
      unsupportedShare: claimStats.total ? (claimStats.unsupported + claimStats.needsVerification) / claimStats.total : 0,
      sourceClassification: sourceAssessable ? reliability.classification : null,
      exclusionReasons: {
        sourceReliability: 'Not scored — pasted text has no verifiable publisher. Analyze the article link to include it.',
        publicationTransparency: 'Not scored — details typed into pasted text cannot be verified.',
        claimConsistency: 'Not scored — no checkable claims were extracted.'
      }
    }
  );
  const suspiciousStatements = (parsed.suspiciousStatements || []).slice(0, 8).map((s) => ({
    quote: String(s.quote || '').slice(0, 400),
    category: s.category || 'Unsupported claim',
    explanation: String(s.explanation || '').slice(0, 500)
  }));
  const suspiciousCategories = new Set(suspiciousStatements.map((s) => s.category));
  const redFlags = (parsed.narrative && parsed.narrative.redFlags) || [];
  const strengths = [];
  const weaknesses = [];
  const weakKeys = new Set(calculated.breakdown.filter((b) => !b.excluded && b.score < 45).map((b) => b.key));
  const strongKeys = new Set(calculated.breakdown.filter((b) => !b.excluded && b.score >= 72).map((b) => b.key));
  if (weakKeys.has('sourceReliability')) weaknesses.push('Source reliability signals are weak.');
  if (weakKeys.has('evidenceQuality')) weaknesses.push('Supporting evidence in the article is thin.');
  if (weakKeys.has('claimConsistency')) weaknesses.push('Several claims are unsupported or internally inconsistent.');
  if (weakKeys.has('publicationTransparency')) weaknesses.push('Author, date or publisher details are missing.');
  if (weakKeys.has('sensationalism')) weaknesses.push('Sensational or clickbait-style language was detected.');
  if (weakKeys.has('writingQuality')) weaknesses.push('Writing shows objectivity issues.');
  if (strongKeys.has('sourceReliability')) strengths.push('Publisher signals point to a generally reliable source.');
  if (strongKeys.has('evidenceQuality')) strengths.push('The article cites sources, data or attributed voices.');
  if (strongKeys.has('publicationTransparency')) strengths.push('Publication details are transparent.');
  if (strongKeys.has('sensationalism')) strengths.push('Writing stays measured, with little sensationalism.');
  if (!weakKeys.size && !calculated.excludedFactorKeys.length) strengths.push('No major weakness was identified across the measured factors.');
  if (redFlags.length) weaknesses.push(...redFlags.slice(0, 2).map((f) => `Signal: ${f}.`));
  if (suspiciousCategories.has('Contradiction')) weaknesses.push('The text contains passages that contradict one another.');
  const articleSaved = articleEntity || (await Article.create({
    url: articleDoc.url || null,
    title: String(articleDoc.title || 'Untitled article').slice(0, 600),
    content: articleDoc.content,
    contentExcerpt: articleDoc.content.slice(0, 300),
    author: articleDoc.author || null,
    publisher: articleDoc.publisher || null,
    publicationDate: articleDoc.publicationDate || null,
    publicationDateText: articleDoc.publicationDateText || null,
    domain: normalizeDomain(articleDoc.domain),
    extractedMetadata: articleDoc.extractedMetadata || {},
    createdBy: user._id
  }));
  const sourceRecord = isPaste ? null : await sourceService.upsertFromAnalysis(articleSaved);
  if (sourceRecord) articleSaved.source = sourceRecord._id;
  if (articleSaved.isModified('source')) await articleSaved.save();
  const analysisDoc = {
    article: articleSaved._id,
    articleTitle: String(articleSaved.title || '').slice(0, 200) || null,
    user: user._id,
    overallScore: calculated.overall,
    verdict: calculated.verdict,
    confidence: calculated.confidence,
    capsApplied: calculated.capsApplied,
    inputKind: isPaste ? 'paste' : 'url',
    sourceReliability: calculated.factors.sourceReliability,
    evidenceQuality: calculated.factors.evidenceQuality,
    claimConsistency: calculated.factors.claimConsistency,
    publicationTransparency: calculated.factors.publicationTransparency,
    writingQuality: calculated.factors.writingQuality,
    sensationalism: calculated.factors.sensationalism,
    factors: calculated.breakdown,
    weights: calculated.weights,
    summary: String(parsed.summary || '').slice(0, 900),
    strengths,
    weaknesses,
    clickbaitScore: clickRaw,
    sensationalismScore: sensRaw,
    clickbaitFindings: (language.clickbaitFindings || []).slice(0, 6).map((f) => `${f.quote} — ${f.reason}`),
    sensationalFindings: (language.sensationalFindings || []).slice(0, 6).map((f) => `${f.quote} — ${f.reason}`),
    sourceAnalysis: {
      identity: parsed.sourceAnalysis.identity || null,
      authorName: parsed.sourceAnalysis.authorName || articleDoc.author || null,
      classification: reliability.classification,
      score: reliability.score,
      known: reliability.known,
      assessed: sourceAssessable,
      reasons: reliability.reasons,
      transparency: reliability.transparency,
      sourceConcerns: parsed.sourceAnalysis.sourceConcerns || []
    },
    suspiciousStatements,
    contradictions: contradictions.map((c) => `${c.quoteA} ⟷ ${c.quoteB}${c.explanation ? ` (${c.explanation})` : ''}`).slice(0, 6),
    externalVerification: external.results || null,
    analysisMode: mode,
    analysisStatus: 'completed',
    isSaved: false
  };
  if (calculated.capsApplied.length) analysisDoc.weaknesses.push(...calculated.capsApplied);
  analysisDoc.explanation = assembleExplanation({
    overall: calculated.overall,
    verdict: calculated.verdict,
    breakdown: calculated.breakdown,
    suspiciousCount: suspiciousStatements.length,
    contradictions,
    evidenceQuality: evidenceScore,
    meta
  });
  const analysis = await persistResult({ analysisDoc });
  const claims = await claimService.persistMapped(mappedClaims, analysis._id, articleSaved._id);
  const flagged = await createFlaggedIfNeeded({
    analysisId: analysis._id,
    articleId: articleSaved._id,
    userId: user._id,
    verdict: calculated.verdict,
    overall: calculated.overall,
    suspiciousStatements,
    contradictions,
    claimStats,
    language: { sensationalismScore: sensRaw, clickbaitScore: clickRaw },
    evidenceQuality: evidenceScore,
    meta: { sourceProfile: { classification: reliability.classification } }
  });
  if (suspiciousStatements.length > 0) await emit({ code: 'suspicious-content', title: 'Suspicious content detected', message: `${suspiciousStatements.length} statement(s) need attention or verification.`, level: 'warning', type: 'alert' });
  if (calculated.verdict === 'Potentially Misleading' || calculated.verdict === 'Highly Suspicious') await emit({ code: 'misleading-content', title: 'Misleading content detected', message: `The article was rated ${calculated.verdict} (${calculated.overall}/100).`, level: 'error', type: 'alert' });
  if (calculated.overall < 25) await emit({ code: 'high-risk-article', title: 'High-risk article detected', message: `Score ${calculated.overall}/100 places this article in the High-risk range.`, level: 'error', type: 'alert' });
  await emit({ code: 'report-generated', title: 'Credibility report generated', message: `Report ready — ${calculated.overall}/100 (${calculated.verdict}).`, level: 'success', type: 'report' });
  return {
    analysisId: analysis._id,
    analysis: analysis.toObject(),
    claims,
    flaggedId: flagged ? flagged._id : null,
    mode,
    factors: calculated.breakdown,
    explanation: analysisDoc.explanation,
    disclaimer: DISCLAIMER,
    sourceProfile: { name: profile.dbSource ? profile.dbSource.name : null, classification: reliability.classification, score: reliability.score, known: profile.known },
    confidence: calculated.confidence,
    claimStats
  };
}
async function runFromUrl(user, url, onEvent) {
  const extracted = await articleService.extractFromUrl(url);
  return runFullAnalysis({ user, articleDoc: extracted, metaMode: 'url', onEvent });
}
async function runFromContent(user, content, pasteMeta, onEvent) {
  if (typeof pasteMeta === 'function') {
    onEvent = pasteMeta;
    pasteMeta = {};
  }
  const meta = pasteMeta || {};
  const cleaned = cleanArticleText(content, 20000);
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
  if (wordCount < 40) {
    throw new AppError('Article content is too short to analyze. Please paste at least a few full paragraphs (about 40 words).', 400, 'CONTENT_TOO_SHORT');
  }
  const firstLine = cleaned.split('\n').map((l) => l.trim()).find(Boolean) || '';
  const firstSentence = cleaned.split(/(?<=[.!?])\s/)[0] || '';
  const looksLikeHeadline = firstLine.length <= 160 && firstLine.split(/\s+/).length <= 25 && firstLine !== cleaned;
  const guessed = looksLikeHeadline ? firstLine : firstSentence.slice(0, 140);
  const title = cleanText(meta.title || guessed || 'Pasted article', 160);
  const sourceUrl = meta.sourceUrl || null;
  let domain = null;
  try {
    domain = sourceUrl ? normalizeDomain(new URL(sourceUrl).hostname) : null;
  } catch (err) {
    domain = null;
  }
  const doc = {
    url: sourceUrl,
    title,
    content: cleaned,
    contentExcerpt: cleaned.slice(0, 300),
    author: cleanText(meta.author || '', 120) || null,
    publisher: cleanText(meta.publisher || '', 120) || null,
    publicationDate: null,
    publicationDateText: null,
    domain,
    extractedMetadata: { mode: 'paste', linkCount: 0, extractionVia: 'paste', wordCount }
  };
  return runFullAnalysis({ user, articleDoc: doc, metaMode: 'content', onEvent });
}
function reportDisclaimer() {
  return DISCLAIMER;
}
module.exports = { runFromUrl, runFromContent, runFullAnalysis, reportDisclaimer, verdictFor };
