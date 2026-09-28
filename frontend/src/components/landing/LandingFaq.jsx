import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
const QA = [
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
export default function LandingFaq() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section id="faq" style={{ scrollMarginTop: 84, padding: 'clamp(3rem, 6vw, 5.5rem) 1rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} className="text-center mb-5">
          <span className="section-label">FAQ</span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.4rem)' }}>Questions, answered</h2>
        </motion.div>
        <div className="d-flex flex-column gap-3">
          {QA.map((item, i) => {
            const open = openIdx === i;
            return (
              <motion.div key={item.q} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 5) * 0.05 }} className="card overflow-hidden">
                <button
                  type="button"
                  className="w-100 d-flex justify-content-between align-items-center gap-3 p-3 p-md-4 text-start"
                  style={{ background: 'transparent', border: 0 }}
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  aria-expanded={open}
                >
                  <span className="fw-bold text-main" style={{ fontSize: 15 }}>{item.q}</span>
                  <ChevronDown size={18} className="flex-shrink-0 text-muted-2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {open ? (
                  <div className="px-3 px-md-4 pb-4 text-secondary-2" style={{ fontSize: 14, maxWidth: 780 }}>{item.a}</div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
