const axios = require('axios');
const env = require('../config/env');
const GEMINI_MODEL = env.geminiModel;
const ANALYSIS_PROMPT = `You are an expert news-credibility analyst engine for TruthLens AI. Analyze the provided news article and return STRICT JSON only, following this exact schema:
{
 "summary": "one paragraph, under 320 characters, neutral summary",
 "sourceAnalysis": {
   "identity": "publisher name as stated or Not stated",
   "authorPresence": "present|partial|absent",
   "authorName": "string or null",
   "publicationDatePresence": true|false,
   "transparencySignals": ["short factual notes"],
   "sourceConcerns": ["concerns about identity transparency, none if none"]
 },
 "languageAnalysis": {
   "clickbaitScore": 0-100,
   "clickbaitFindings": [{"quote":"exact short quote","reason":"why it is clickbait"}],
   "sensationalismScore": 0-100,
   "sensationalFindings": [{"quote":"exact short quote","reason":"why it is sensational"}],
   "tone": "neutral|analytical|emotional|alarmist|promotional|satirical",
   "emotionalAppeal": true|false,
   "manipulationExplanation": "short explanation or empty string"
 },
 "writingAnalysis": {
   "qualityScore": 0-100,
   "structureScore": 0-100,
   "objectivityIssues": ["short issues or empty"],
   "qualityNotes": ["short factual observations"]
 },
 "evidenceAssessment": {
   "qualityScore": 0-100,
   "sourcesCited": ["names of cited sources/links/studies or empty"],
   "dataOrQuotesPresent": true|false,
   "expertVoices": true|false,
   "missingEvidence": ["types of evidence missing"]
 },
 "contradictionCheck": {
   "internalContradictions": [{"quoteA":"quote","quoteB":"quote","explanation":"short"}],
   "inconsistencyScore": 0-100
 },
 "claims": [
   {
     "quote": "exact sentence from the article containing the claim",
     "importance": "Critical|High|Medium",
     "inTextSupport": "supported|partial|none",
     "supportNote": "what support appears inside the article, or what is missing",
     "needsExternalCheck": true|false
   }
 ],
 "suspiciousStatements": [
   {
     "quote": "exact short quote",
     "category": "Unsupported claim|Missing evidence|Contradiction|Extreme or generalized statement|Sensational language|Suspicious publication information",
     "explanation": "why this needs attention"
   }
 ],
 "narrative": {
   "generalTone": "short",
   "biasIndicators": ["short"],
   "redFlags": ["short"]
 }
}
Rules:
- Be rigorous and neutral. Never declare a statement true or false absolutely; characterize evidence and consistency.
- Distinguish "no support found inside the article" from "contradicted".
- Claims list: capture the 3 to 8 most important factual claims only; quote each EXACTLY from the article text.
- suspiciousStatements: only genuinely notable passages; up to 6.
- Do not invent URLs, studies or quotes that are not in the article.`;
function firstJsonBlock(text) {
  if (!text) return null;
  let t = String(text).trim();
  const fence = t.indexOf('```');
  if (fence !== -1) {
    t = t.replace(/```[a-zA-Z]*/g, '');
  }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (err) {
    return null;
  }
}
function isConfigured() {
  return Boolean(env.geminiApiKey);
}
async function generateOnce(payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  let res;
  try {
    res = await axios.post(url, payload, {
      params: { key: env.geminiApiKey },
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    const status = err.response ? err.response.status : 'network';
    const detail =
      (err.response && err.response.data && (err.response.data.error && err.response.data.error.message)) ||
      err.message;
    throw new Error(`Gemini ${GEMINI_MODEL} request failed (${status}): ${detail}`);
  }
  const data = res.data;
  const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  if (!parts || !parts.length) return null;
  return parts.map((p) => p.text || '').join('');
}
function buildGenerationConfig({ thinkingLevel = 'medium', maxOutputTokens = 8192, mime = null } = {}) {
  const generationConfig = { maxOutputTokens, thinkingConfig: { thinkingLevel } };
  if (mime) generationConfig.responseMimeType = mime;
  return generationConfig;
}
async function generateStructured(promptParts, { thinkingLevel = 'medium', maxOutputTokens = 8192 } = {}) {
  const payload = {
    contents: [{ role: 'user', parts: promptParts.map((t) => ({ text: t })) }],
    generationConfig: buildGenerationConfig({ thinkingLevel, maxOutputTokens, mime: 'application/json' })
  };
  const text = await generateOnce(payload);
  if (text) return { model: GEMINI_MODEL, text };
  throw new Error('Gemini generation returned no content');
}
async function analyzeArticle(articleDoc) {
  if (!isConfigured()) return null;
  const meta = {
    title: articleDoc.title || '(untitled)',
    domain: articleDoc.domain || null,
    publisher: articleDoc.publisher || null,
    author: articleDoc.author || null,
    publicationDate: articleDoc.publicationDateText || null,
    mode: articleDoc.mode || 'url'
  };
  const body = `ARTICLE META:\n${JSON.stringify(meta)}\n\nARTICLE CONTENT:\n${articleDoc.content}`;
  const { text } = await generateStructured([ANALYSIS_PROMPT, body], { thinkingLevel: 'high', maxOutputTokens: 20000 });
  const parsed = firstJsonBlock(text);
  if (!parsed) throw new Error('Gemini returned an unparseable analysis response');
  return parsed;
}
async function groundedClaimCheck(claims, articleMeta) {
  if (!isConfigured()) return null;
  const instruction = `You have live web search. Verify the factual claims below against the open web (they come from an article at ${articleMeta.domain || 'unknown domain'}). For each claim search authoritative sources. Return STRICT JSON:
{"results":[{"index":0,"position":"Supported|Partially Supported|Needs Verification|Contradicted|Unsupported","confidence":0-100,"evidenceSummary":"one sentence","sources":[{"title":"...","url":"...","stance":"Supports|Partial|Contradicts|Neutral"}]}]}
Rules: Never fabricate sources; only cite pages you actually retrieved. If you cannot find relevant results mark Needs Verification with empty sources. Position reflects what authoritative sources say.`;
  const claimsPayload = JSON.stringify(claims.map((c, i) => ({ index: i, quote: c.quote, importance: c.importance })));
  const payload = {
    contents: [{ role: 'user', parts: [{ text: instruction }, { text: claimsPayload }] }],
    generationConfig: buildGenerationConfig({ thinkingLevel: 'medium', maxOutputTokens: 12000, mime: 'application/json' }),
    tools: [{ google_search: {} }]
  };
  const { text } = await generateOnce(payload);
  const parsed = firstJsonBlock(text);
  if (!parsed || !Array.isArray(parsed.results)) return null;
  return parsed.results;
}
async function classifySnippets(claim, snippets) {
  if (!isConfigured()) return null;
  const instruction = `Judge how these web-search results relate to the given claim from a news article. Return STRICT JSON:
{"position":"Supported|Partially Supported|Needs Verification|Contradicted|Unsupported","confidence":0-100,"evidenceSummary":"one sentence","sources":[{"title":"...","url":"...","stance":"Supports|Partial|Contradicts|Neutral"}]}
Prefer mainstream, established outlets and official records. A claim with no corroborating and no contradicting result is "Needs Verification" with empty sources. Do not invent results.`;
  const { text } = await generateStructured(
    [instruction, `CLAIM: ${claim.quote}\n\nSEARCH RESULTS:\n${JSON.stringify(snippets.slice(0, 8))}`],
    { thinkingLevel: 'low', maxOutputTokens: 8192 }
  );
  return firstJsonBlock(text);
}
async function summarizeVerification(claimsWithResults) {
  const { text } = await generateStructured(
    [
      `Summarize cross-source verification results for a credibility report. Return STRICT JSON:
{"note":"one or two sentences describing overall corroboration landscape","perClaim":[{"index":0,"evidenceSummary":"one sentence","sources":[{"title":"...","url":"...","stance":"Supports|Partial|Contradicts|Neutral"}]}]}`,
      JSON.stringify(claimsWithResults)
    ],
    { thinkingLevel: 'low', maxOutputTokens: 8192 }
  );
  return firstJsonBlock(text);
}
module.exports = { MODEL: GEMINI_MODEL, isConfigured, analyzeArticle, groundedClaimCheck, classifySnippets, summarizeVerification };
