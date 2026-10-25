export const FAQ_ITEMS = [
  {
    q: 'What is TruthLens AI?',
    a: 'TruthLens AI is an AI-powered news credibility analyzer. You submit a news article by URL, and the system examines the source, publication details, writing patterns, sensationalism, evidence quality and important claims. You receive a transparent credibility score with a plain-language explanation of why the article scored that way.'
  },
  {
    q: 'How is the credibility score calculated?',
    a: 'The backend computes the score from six weighted factors: Source Reliability (22%), Evidence Quality (22%), Claim Consistency (22%), Publication Transparency (13%), Writing Quality (8%) and Sensationalism (13%). Every factor is scored on its own evidence.'
  },
  {
    q: 'Can TruthLens AI determine whether an article is definitely true?',
    a: 'No — and it will never claim to. Credibility is not the same as truth. TruthLens AI produces an assessment of how credible, well-sourced, consistent and transparent an article appears, while flagging statements that need verification. Verdicts are expressed in careful levels such as “Highly Credible” or “Potentially Misleading”, never as an absolute true/false stamp.'
  },
  {
    q: 'Can I analyze an article using only its URL?',
    a: 'Yes. Paste the article URL and TruthLens AI will try to extract the title, body text, author, publication date, publisher and metadata. Some websites block automated readers; when extraction fails you will get a clear message asking you to paste the article content instead — the analysis depth is the same either way.'
  },
  {
    q: 'Can I paste article content?',
    a: 'Absolutely. Use the “Content Analysis” option and paste the full article text. This is also the recommended fallback for sites behind paywalls or bot protection. Content analysis performs the same claim extraction, sensationalism detection, evidence assessment and scoring pipeline as URL analysis.'
  },
  {
    q: 'Can I download an analysis report?',
    a: 'Yes. Every completed analysis can be downloaded as a branded PDF report containing the article information, overall score and verdict, score breakdown, source analysis, claim analysis, suspicious statements and the AI explanation.'
  },
  {
    q: 'How does claim verification work?',
    a: 'The AI first extracts the most important factual claims. Each claim is then checked for internal support within the article and — where external search is available — compared against independent sources on the web. Results are classified as Supported, Partially Supported, Needs Verification, Contradicted or Unsupported. If independent verification is unavailable, the report says so clearly instead of guessing.'
  },
  {
    q: 'How does TruthLens AI detect suspicious content?',
    a: 'Multiple detectors look for clickbait patterns (excessive capitals, curiosity gaps, “you won\'t believe” phrasing), sensational language (fear and shock words), emotional manipulation, unsupported superlatives, extreme generalizations, contradictions and missing publication information. Suspicious passages are highlighted inside the report with per-statement explanations, so you can judge them yourself.'
  }
];
