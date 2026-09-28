const CLICKBAIT_PHRASES = [
  'you won\'t believe', 'shocking truth', 'what happens next', 'the internet is furious', 'gone viral',
  'everyone is talking', 'doctors hate', 'one weird trick', 'can\'t handle the truth', 'will blow your mind',
  'this is huge', 'breaking: unbelievable', 'nobody expected', 'secret they don\'t want you to know',
  'must read', 'incredible discovery', 'outrageous', 'unbelievable', 'mind-blowing', 'jaw-dropping'
];
const SENSATIONAL_WORDS = [
  'horrifying', 'terrifying', 'devastating', 'catastrophic', 'chaos', 'bloodbath', 'nightmare',
  'epidemic', 'crisis', 'panic', 'fear', 'fury', 'rage', 'shocking', 'alarming', 'dire', 'doomsday',
  'apocalyptic', 'slaughter', 'massacre', 'disaster', 'outrage', 'scandal', 'bombshell', 'explosive'
];
const EXTREME_PATTERNS = [
  /\b(always|never|everyone|no one|absolutely|definitely|completely|certainly)\b/i,
  /\b(all|none|every|nobody) (of )?(the|their)?\s*(indians?|people|citizens|experts|scientists|officials|doctors)\b/i
];
const CITATION_HINTS = ['according to', 'said', 'says', 'reports', 'study', 'data from', 'confirmed', 'announced', 'stated', 'told '];
const AUTHORITY_HINTS = ['government', 'official', 'university', 'research', 'survey', 'department', 'ministry', 'court', 'police'];
const UPPERCASE_BIAS = 0.18;
const MAX_EXCLAIMS = 2;
function countMatches(text, list) {
  const lower = text.toLowerCase();
  let n = 0;
  for (const phrase of list) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) n += 1;
    if (idx === -1 && /\s/.test(phrase)) {
      const parts = phrase.split(' ');
      const alt = lower.split(' ').filter((w) => parts.includes(w));
      if (alt.length >= parts.length - 1 && alt.length) n += 0.5;
    }
  }
  return n;
}
function sentenceSplit(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 40 && s.length < 400);
}
function pickSentence(text, keyword) {
  const sentences = sentenceSplit(text);
  return sentences.find((s) => s.toLowerCase().includes(keyword.toLowerCase())) || null;
}
function scoreFromCount(base, count, max, cap = 92) {
  return Math.max(0, Math.min(cap, base + count * (cap - base) / Math.max(1, max)));
}
function getFlags() {
  const flags = {
    clickbaitPhrases: CLICKBAIT_PHRASES,
    sensationalWords: SENSATIONAL_WORDS,
    citationHints: CITATION_HINTS,
    authorityHints: AUTHORITY_HINTS,
    extremePatterns: EXTREME_PATTERNS,
    uppercaseBias: UPPERCASE_BIAS,
    maxExclaims: MAX_EXCLAIMS
  };
  return flags;
}
function analyzeHeuristically(articleDoc) {
  const text = articleDoc.content || '';
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/);
  const wordCount = words.length || 1;
  const title = articleDoc.title || '';
  const combined = `${title} ${text}`.slice(0, 6000);
  const clickbaitHits = countMatches(combined, CLICKBAIT_PHRASES);
  const sensationalHits = countMatches(combined, SENSATIONAL_WORDS);
  const exclaims = (text.match(/!/g) || []).length;
  const questionMarks = (text.match(/\?/g) || []).length;
  const capsWords = words.filter((w) => /^[A-Z]{2,}$/.test(w.replace(/[^A-Za-z]/g, '')) && w.length > 2).length;
  const capsRatio = capsWords / Math.max(1, words.length);
  const uppercasePenalty = capsRatio > UPPERCASE_BIAS ? Math.min(22, (capsRatio - UPPERCASE_BIAS) * 220) : 0;
  const clickbaitScore = Math.round(Math.min(96, 8 + clickbaitHits * 16 + (exclaims > 0 ? Math.min(18, exclaims * 5) : 0) + questionMarks + uppercasePenalty));
  const sensationalismScore = Math.round(Math.min(96, 6 + sensationalHits * 12 + (exclaims > 0 ? Math.min(14, exclaims * 4) : 0) + uppercasePenalty));
  const citationHits = CITATION_HINTS.filter((h) => lower.includes(h)).length;
  const authorityHits = AUTHORITY_HINTS.filter((h) => lower.includes(h)).length;
  const quoteCount = (text.match(/["'“”‘’]/g) || []).length;
  const sentences = sentenceSplit(text);
  const statSentences = sentences.filter((s) => /\d{2,}(%| percent| crore| lakh| million| billion| thousand)|Rs\.?\s?[\d,]|₹[\d,]/.test(s));
  const avgSentenceLen = words.length / Math.max(1, sentences.length);
  const evidenceScore = Math.round(Math.min(92, 22 + citationHits * 9 + authorityHits * 7 + (quoteCount >= 4 ? 8 : quoteCount >= 1 ? 3 : 0) + Math.min(14, statSentences.length * 2)));
  const qualityScore = Math.round(Math.min(90, Math.max(30, 62 - Math.abs(avgSentenceLen - 24) * 0.8 + (sentences.length > 4 ? 8 : 0))));
  const structureScore = Math.round(Math.min(92, 55 + (sentences.length > 5 ? 12 : 0) + (articleDoc.title ? 8 : 0)));
  const claims = [];
  const suspiciousStatements = [];
  const clickbaitFindings = [];
  const sensationalFindings = [];
  const missingEvidence = [];
  for (const phrase of CLICKBAIT_PHRASES) {
    const s = pickSentence(combined, phrase);
    if (s) clickbaitFindings.push({ quote: s.slice(0, 180), reason: `Contains the clickbait pattern "${phrase}".` });
  }
  for (const word of SENSATIONAL_WORDS) {
    const s = pickSentence(combined, word);
    if (s) sensationalFindings.push({ quote: s.slice(0, 180), reason: `Uses the sensational word "${word}".` });
  }
  const candidates = [...statSentences, ...sentences.filter((s) => /(said|says|claims|announced|confirmed|according to)/i.test(s))];
  const seen = new Set();
  for (const s of candidates) {
    if (claims.length >= 5) break;
    const key = s.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    const hasCitation = CITATION_HINTS.some((h) => s.toLowerCase().includes(h));
    const hasNumber = /\d/.test(s);
    const importance = hasNumber && hasCitation ? 'High' : hasNumber || hasCitation ? 'Medium' : 'Low';
    const support = hasCitation ? 'partial' : 'none';
    claims.push({
      quote: s.slice(0, 300),
      importance,
      inTextSupport: support,
      supportNote: hasCitation
        ? 'The statement names a source or reference within the text; strength of that reference could not be fully evaluated offline.'
        : 'No source or reference is cited inside the article for this statement.',
      needsExternalCheck: true
    });
    if (support === 'none' && claims.length <= 3) {
      suspiciousStatements.push({
        quote: s.slice(0, 180),
        category: hasNumber ? 'Unsupported claim' : 'Extreme or generalized statement',
        explanation: 'No citation or supporting reference appears near this statement in the text. Heuristic scan; treat as informational.'
      });
    }
  }
  if (exclaims > MAX_EXCLAIMS) {
    const exclaimSentence = sentences.find((s) => s.includes('!'));
    if (exclaimSentence) suspiciousStatements.push({ quote: exclaimSentence.slice(0, 180), category: 'Sensational language', explanation: 'Heavy exclamatory punctuation suggests emotional manipulation rather than neutral reporting.' });
  }
  if (EXTREME_PATTERNS.some((re) => re.test(combined))) {
    const match = sentences.find((s) => EXTREME_PATTERNS.some((re) => re.test(s)));
    if (match) suspiciousStatements.push({ quote: match.slice(0, 180), category: 'Extreme or generalized statement', explanation: 'Contains absolute or sweeping wording ("always", "never", "everyone") that is rarely supportable in news reporting.' });
  }
  if (articleDoc.mode === 'url' && !articleDoc.publisher && !articleDoc.author) {
    suspiciousStatements.push({ quote: 'Publication identity is not stated in metadata.', category: 'Suspicious publication information', explanation: 'The page did not expose a clear publisher, author or publication date.' });
  }
  if (evidenceScore < 45) missingEvidence.push('Attribution, named sources or statistics appear rarely in the text.');
  if (statSentences.length === 0) missingEvidence.push('No statistics or verifiable quantitative data were detected.');
  const sourceConcerns = [];
  const transparencySignals = [];
  if (articleDoc.publisher) transparencySignals.push(`Publisher stated: ${articleDoc.publisher}`);
  else sourceConcerns.push('Publisher identity is not clearly stated.');
  if (articleDoc.author) transparencySignals.push(`Author present: ${articleDoc.author}`);
  else sourceConcerns.push('No byline/author information found.');
  if (articleDoc.publicationDateText) transparencySignals.push(`Publication date present: ${articleDoc.publicationDateText}`);
  else sourceConcerns.push('Publication date is missing or unclear.');
  return {
    summary: `Heuristic offline analysis of "${(articleDoc.title || '').slice(0, 140)}". Signals were measured from ${wordCount} words: sensational language, citation density, punctuation style and publication metadata. No AI model or external verification was used.`,
    sourceAnalysis: {
      identity: articleDoc.publisher || 'Not stated',
      authorPresence: articleDoc.author ? 'present' : 'absent',
      authorName: articleDoc.author || null,
      publicationDatePresence: Boolean(articleDoc.publicationDateText),
      transparencySignals,
      sourceConcerns
    },
    languageAnalysis: {
      clickbaitScore,
      clickbaitFindings: clickbaitFindings.slice(0, 4),
      sensationalismScore,
      sensationalFindings: sensationalFindings.slice(0, 4),
      tone: sensationalismScore > 55 ? 'emotional' : sensationalismScore > 35 ? 'promotional' : 'neutral',
      emotionalAppeal: sensationalismScore > 45 || clickbaitScore > 45,
      manipulationExplanation: sensationalismScore > 45 ? 'Detected elevated use of sensational vocabulary and punctuation typical of engagement-driven writing.' : ''
    },
    writingAnalysis: {
      qualityScore,
      structureScore,
      objectivityIssues: sensationalismScore > 50 ? ['Elevated emotional language reduces objectivity signals.'] : [],
      qualityNotes: [`Average sentence length ${Math.round(avgSentenceLen)} words across ${sentences.length} sentences.`, capsRatio > UPPERCASE_BIAS ? 'Unusually high share of ALL-CAPS words.' : 'Normal capitalization pattern.']
    },
    evidenceAssessment: {
      qualityScore: evidenceScore,
      sourcesCited: authorityHits ? ['Named authority mentions detected'] : [],
      dataOrQuotesPresent: statSentences.length > 0 || quoteCount > 0,
      expertVoices: authorityHits > 1,
      missingEvidence: missingEvidence.slice(0, 3)
    },
    contradictionCheck: {
      internalContradictions: [],
      inconsistencyScore: 0
    },
    claims,
    suspiciousStatements: suspiciousStatements.slice(0, 6),
    narrative: {
      generalTone: sensationalismScore > 45 ? 'engagement-oriented' : 'informational',
      biasIndicators: sensationalismScore > 50 ? ['Emotionally charged vocabulary'] : [],
      redFlags: []
    }
  };
}
module.exports = { analyzeHeuristically, getFlags, scoreFromCount };
